import util from 'util';

import { types } from '@ioc:Adonis/Core/Helpers'

import UnidadesOrganizacionaisController from "App/Controllers/Http/iffar/UnidadesOrganizacionaisController";
import CursosController from 'App/Controllers/Http/iffar/CursosController';
import MunicipiosController from 'App/Controllers/Http/iffar/MunicipiosController';
import GrausAcademicosController from 'App/Controllers/Http/iffar/GrausAcademicosController';
import PnpMatricula from 'App/Models/PnpMatricula';
import Curso from 'App/Models/iffar/Curso';

a();

async function a() {
    //Seleciono o curso específico
    const cursoC = new CursosController();
    let curso = await cursoC.get(62474);
    console.log(util.inspect(curso));

    //Pego os dados da unidade organizacional do curso (para pegar o município)
    const unidadeC = new UnidadesOrganizacionaisController()
    let unidade = await unidadeC.get(curso.id_unidade);
    console.log(util.inspect(unidade));

    //Pego os dados do município da unidade organizacional do curso
    const municipioC = new MunicipiosController();
    let municipio = await municipioC.get(unidade.id_municipio);
    console.log(util.inspect(municipio));

    /** Verifico o id_modalidade_educacao dos dados do IFFar para definir a modalidadeDeEnsino do PNP:
     * id_modalidade_educacao	descricao
     * 1	                    Presencial
     * 3	                    Semi-Presencial
     * 2	                    A Distância
     * 4	                    Remoto
     */
    let modalidadeDeEnsino: string;
    switch (curso.id_modalidade_educacao){
        case 3: //O PNP conta o semi-presencial como presencial
        case 1: modalidadeDeEnsino = 'Educação Presencial'; break;
        case 2: modalidadeDeEnsino = 'Educação a Distância'; break;
        default: modalidadeDeEnsino = 'Educação Presencial'; //Valor padrão para caso não tenha sido setada a modalidade do curso (falta de integridade nos dados)
        //Não existe nenhum curso com a modalidade 4 / Remoto
    }

    /** Verifico o nível de ensino do curso para filtrar com ainda mais segurança do resultado.
     * Nível de Ensino do Curso:
     * M - Integrado: anterior a 2018
     * N - Integrado: a partir de 2018
     * T - Subsequente
     * G - Graduação
     * L - Lato Sensu
     * E - Stricto Sensu
     * 
     * F - ??? (A API não documenta o nível F, apesar de eu supor que seja FIC)
     */
    let tipoDeCurso: string;
    let tipoDeOferta: string;
    switch (curso.nivel){
        case 'M':
        case 'N':
            tipoDeCurso = 'Técnico';
            //Testo se tem PROEJA no nome, para diferençar o integrado PROEJA do integrado ao ensino médio
            if(/proeja/.test(curso.nome.toLowerCase()))
                tipoDeOferta = 'PROEJA - Integrado';
            else
                tipoDeOferta = 'Integrado';
            break;
        case 'T':
            tipoDeCurso = 'Técnico';
            tipoDeOferta = 'Subsequente';
            break;
        case 'L': 
            tipoDeCurso = 'Especialização (Lato Sensu)';
            tipoDeOferta = 'Não se aplica';
            break;
        case 'E': 
            tipoDeCurso = 'Mestrado Profissional';
            tipoDeOferta = 'Não se aplica';
            break;
        case 'F': //Estou supondo que F seja FIC, visto que não possui registro na documentação
            tipoDeCurso = 'Qualificação Profissional (FIC)';
            tipoDeOferta = 'Não se aplica';
            break;
        case 'G':
            /** Para a graduação, verifico o grau acadêmico:
             * id_grau_academico	descricao
             * 8067070	            LICENCIATURA
             * 2	                PROGRAMAS ESPECIAIS DE FORMAÇÃO PEDAGÓGICA
             * 1	                BACHARELADO
             * 4	                TECNOLOGIA
             */
            switch(curso.id_grau_academico){
                case 2: //O PNP considera como licenciatura o único curso desse tipo (e o título do grau nos dados do IFFar indicam o mesmo)
                case 8067070:
                    tipoDeCurso = 'Licenciatura';
                    tipoDeOferta = 'Não se aplica';
                    break;
                case 1:
                    tipoDeCurso = 'Bacharelado';
                    tipoDeOferta = 'Não se aplica';
                    break;
                case 4:
                    tipoDeCurso = 'Tecnologia';
                    tipoDeOferta = 'Não se aplica';
                    break;
                default: //TENHO QUE DEFINIR O DEFAULT
            }
            break;
        default: //TENHO QUE DEFINIR O DEFAULT
    }



    const grauC = new GrausAcademicosController();
    let grau = await grauC.get(curso.id_grau_academico);
    console.log(util.inspect(grau));

    //Pego a lista de cursos do PNP para filtrar e localizar o curso do PNP que é o equivalente aos dados abertos do IFFar, para só, então, depois buscar os registros de matrículas desse curso
    let pnpCursos = await PnpMatricula
        .query()
        .where('nomeMunicipio', municipio.nome)
        .where('modalidadeDeEnsino', modalidadeDeEnsino)
        .where('tipoDeCurso', tipoDeCurso)
        .where('tipoDeOferta', tipoDeOferta)
        .groupBy('nomeDeCurso');

    let nomeDeCurso = returnCorrectPnpCourse(curso, pnpCursos);
    console.log("E o curso se chama: "+nomeDeCurso);
    
    function returnCorrectPnpCourse(curso: Curso, pnpCursos: Array<PnpMatricula>): string|null{
        for(let i = 0; i < pnpCursos.length; i++){
            let normalizedName = normalizeString(pnpCursos[i].nomeDeCurso)
            let regex = new RegExp(normalizedName.toLowerCase(), 'u');
            console.log(regex)
            if(regex.test(normalizeString(curso.nome).toLowerCase()))
                return pnpCursos[i].nomeDeCurso
        }
        return null;
    }

    if(!types.isNull(nomeDeCurso)){
        let pnpMatriculas = await PnpMatricula
            .query()
            .where('nomeMunicipio', municipio.nome)
            .where('modalidadeDeEnsino', modalidadeDeEnsino)
            .where('tipoDeCurso', tipoDeCurso)
            .where('tipoDeOferta', tipoDeOferta)
            .where('nomeDeCurso', nomeDeCurso);
        console.log('Quantia de matrículas: '+pnpMatriculas.length);
    }else{
        //LIDAR COM O CASO DE SER NULO. O QUE FAZER?
    }

    function normalizeString(string: string): string{
        return string.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    }
        
    //Aqui se faz o tratamento do nome do curso, retornando o nome limpo necessário para bater com o nome no PNP. O nome dos cursos nos dados abertos do IFFar estão "sujos" com outras informações
    //Ex.: LICENCIATURA EM EDUCAÇÃO DO CAMPO - CIÊNCIAS AGRÁRIAS ou BACHARELADO EM ADMINISTRAÇÃO

    /** 
     * Estratégia para selecionar as matrículas específicas de um curso dos dados abertos do IFFar
     * - Pego o curso específico dos dados do IFFar
     * - Nos dados do PNP:
     *      filtro pelo município
     *          PNP: nomeMunicipio
     *          IFFar: nome do município da unidade organizacional do curso (os cursos possuem o id_municipio, porém, em alguns registros estão vazios e em outros apresentam Santa Maria como o município por conta de serem EaD)
     *      filtro se a oferta é presencial ou à distância
     *          PNP: modalidadeDeEnsino
     *          IFFar: id_modalidade_educacao
     *      filtro entre curso técnico ou graduação (cada um pede uma estratégia um pouco diferente)
     *          PNP: tipoDeCurso
     *          IFFar: nivel (letrinha: técnico integrado, subsequente, graduação, lato sensu, estricto sensu)
     *                 id_grau_academico (graduação: bacharelado, licenciatura, tecnologia)
     *      Técnico:
     *          filtro por:
     *          PNP: tipoDeOferta ou tipoOferta (integrado, subsequente, PROEJA, etc.) (qual a diferença dos dois?)
     * - Uso RegEx para pegar o nome do curso do PNP e verificar se ele está contido no nome de um curso nos dados abertos do IFFar
     *          
     */


}