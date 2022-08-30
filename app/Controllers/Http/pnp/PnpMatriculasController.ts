// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Curso from 'App/Models/iffar/Curso';
import UnidadeOrganizacional from 'App/Models/iffar/UnidadeOrganizacional';
import PnpMatricula from 'App/Models/PnpMatricula';
import util from 'util';
import AlunosController from '../iffar/AlunosController';

import MunicipiosController from '../iffar/MunicipiosController';
import UnidadesOrganizacionaisController from "../iffar/UnidadesOrganizacionaisController";

export default class PnpMatriculasController {

    //Pega as matrículas do IFFar como um todo (leia-se: não define município ou outro atributo como filtro no select, praticamente sem WHERE)
    public async getIffar(): Promise<Array<PnpMatricula>>{
        let pnpMatriculas = await PnpMatricula
            .query();
        return pnpMatriculas;
    }

    //TODO num futuro: Poder definir pegar do município ou de unidade específica (ex.: uma instituição que tivesse mais de uma unidade de ensino em uma mesma cidade. No caso do IFFar, atualmente, apenas a cidade já é o suficiente)
    public async getUnit(unit: UnidadeOrganizacional): Promise<Array<PnpMatricula>>{
        console.log('Unidade: '+util.inspect(unit.nome));

        //Pego os dados do município da unidade organizacional do curso
        const municipiosC = new MunicipiosController();
        let city = await municipiosC.get(unit.id_municipio);
        console.log('Cidade: '+util.inspect(city.nome));
        
        let pnpMatriculas = await PnpMatricula
            .query()
            .where('nomeMunicipio', city.nome);
        return pnpMatriculas;
    }

    //Questiono: crio funções para outros tipo de filtro das matrículas ou apenas pego todas as matrículas de uma unidade, ou do IFFar todo, e utilizo um filter() para conseguir o que quero? Outra opção, setar atributos nas funções getUnit() e getIffar()
    //Talvez faça sentido fazer funções específicas se forem criadas páginas específicas para esses outros tipos de filtros)

    
    /** 
     * Estratégia para selecionar as matrículas específicas de um curso dos dados abertos do IFFar
     * - Pego o curso específico dos dados do IFFar
     * - Nos dados da PNP:
     *      filtro as edições da PNP para se fazer a busca conforme a verificação de alunos registrados na base de dados abertos do IFFar "alunos" no determinado ano base da PNP 
     *          Assim evita o risco de procurar informações de um curso não mais ativo ou de entregar informações de um curso diferente, por não haver um nome de curso mais correto para se encaixar na RegEx que procura o nome do curso na PNP (ex.: Técnico em informática para internet do Campus Uruguaiana, que retornaria os dados do curso Técnico em informática, por conta de não haver registro desse curso no ano base de 2020, atualmente o único utilizado)
     *      filtro pelo município
     *          PNP: nomeMunicipio
     *          IFFar: nome do município da unidade organizacional do curso (os cursos possuem o id_municipio, porém, em alguns registros estão vazios e em outros apresentam Santa Maria como o município por conta de serem EaD)
     *      filtro se a oferta é presencial ou à distância
     *          PNP: modalidadeDeEnsino
     *          IFFar: id_modalidade_educacao
     *      filtro entre tipo de curso (todos os tipo de cursos técnicos e de graduação)
     *          PNP: tipoDeCurso
     *               tipoDeOferta
     *          IFFar: nivel (letrinha: técnico integrado, subsequente, graduação, lato sensu, estricto sensu)
     *                 id_grau_academico (graduação: bacharelado, licenciatura, tecnologia)
     * - Uso RegEx para pegar o nome do curso da PNP e verificar se ele está contido no nome de um curso nos dados abertos do IFFar
     *      Para o caso de mais de um curso da PNP encaixar na RegEx, retorna a de maior comprimento
     *      Ex.: Um curso "Técnico em informática para internet" possuiria como resultado válido na RegEx tanto "Técnico em informática para internet" quanto "Técnico em informática". E se existissem esses dois cursos em um mesmo campus, poderia retornar os dados incorretos
     *          
     */
    //TODO: Criar função para que se verifique se existem alunos matriculados em determinado ano no curso (dados abertos do IFFar) e que se não encontrar curso ou matrículas no mesmo ano base da PNP, notifique ou registre isso. Serviria para detectar problemas de integridade nos dados, na PNP ou por parte do IFFar (o mais provável)
    public async getCourse(course: Curso): Promise<Array<PnpMatricula>>{
        /**
         * Preciso pensar na lógica de lista de exceções, onde associo um curso_id dos dados do IFFar com o ('nomeMunicipio', 'modalidadeDeEnsino', 'tipoDeCurso', 'tipoDeOferta' e 'nomeDeCurso') da PNP
         * Utilizo banco para isso?
         */

        //Seleciono o curso específico
        console.log('Curso: '+util.inspect(course.nome));

        //Pego os dados da unidade organizacional do curso para pegar o município (muitos cursos não possuem o id_municipio setado, ou então até setados erroneamente, assim, pegar da unidade organizacional parece mais seguro de erros)
        const unidadesC = new UnidadesOrganizacionaisController()
        let unit = await unidadesC.get(course.id_unidade);
        console.log('Unidade: '+util.inspect(unit.nome));

        //Pego os dados do município da unidade organizacional do curso
        const municipiosC = new MunicipiosController();
        let city = await municipiosC.get(unit.id_municipio);
        console.log('Cidade: '+util.inspect(city.nome));

        //Verifico se existem alunos matriculados no ano, através da base "alunos" dos dados abertos do IFFar antes de relizar as solicitações nos dados da PNP
        const alunosC = new AlunosController();
        let students = await alunosC.getStudentsFromCourse(course.id_curso, 0, 2020);
        if(students.length == 0){
            console.log('Não há estudantes nesse curso no ano')
            return [];
        }

        //Verifico a modalidade de oferta do curso (a distância ou presencial)
        let modalidadeDeEnsino = this.getPnpModality(course);        

        //Verifico o nível de ensino do curso para filtrar com ainda mais segurança do resultado.
        let {tipoDeCurso, tipoDeOferta} = this.getPnpTypes(course)

        //Pego a lista de cursos da PNP para filtrar e localizar o curso da PNP que é o equivalente aos dados abertos do IFFar, para só, então, depois buscar os registros de matrículas desse curso
        let pnpCourses = await PnpMatricula
            .query()
            .where('nomeMunicipio', city.nome)
            .where('modalidadeDeEnsino', modalidadeDeEnsino)
            .where('tipoDeCurso', tipoDeCurso)
            .where('tipoDeOferta', tipoDeOferta)
            .groupBy('nomeDeCurso');

        let nomeDeCurso = this.getPnpCourseName(course, pnpCourses);
        console.log("E o curso se chama: "+nomeDeCurso);

        //Pego então as matrículas em si da PNP. Inicializo por padrão o vetor para caso não haja curso ( if(nomeDeCurso.length > 0) ), retorne pelo menos um vetor vazio
        let pnpMatriculas: Array<PnpMatricula> = [];
        if(nomeDeCurso.length > 0){
            pnpMatriculas = await PnpMatricula
                .query()
                .where('nomeMunicipio', city.nome)
                .where('modalidadeDeEnsino', modalidadeDeEnsino)
                .where('tipoDeCurso', tipoDeCurso)
                .where('tipoDeOferta', tipoDeOferta)
                .where('nomeDeCurso', nomeDeCurso);
            console.log('Quantia de matrículas: '+pnpMatriculas.length);
        }
        
        return pnpMatriculas;
    }

    private getPnpModality(course: Curso): string{
        //Verifico o id_modalidade_educacao dos dados do IFFar para definir a modalidadeDeEnsino da PNP:
        /**
         * id_modalidade_educacao -	descricao:
         * 1 -	                    Presencial;
         * 3 -	                    Semi-Presencial;
         * 2 -	                    A Distância;
         * 4 -	                    Remoto;
         */
        let modalidadeDeEnsino: string;
        switch (course.id_modalidade_educacao){
            case 3: //A PNP conta o semi-presencial dos dados abertos do IFFar como presencial
            case 1: modalidadeDeEnsino = 'Educação Presencial'; break;
            case 2: modalidadeDeEnsino = 'Educação a Distância'; break;
            default: modalidadeDeEnsino = 'Educação Presencial'; //Valor padrão para caso não tenha sido setada a modalidade do curso (falta de integridade nos dados)
            //Não existe nenhum curso com a modalidade 4 / Remoto
        }

        return modalidadeDeEnsino;
    }

    private getPnpTypes(course: Curso): {tipoDeCurso: string, tipoDeOferta: string}{
        /**
         * Nível de Ensino do Curso:
         * M - Integrado: anterior a 2018;
         * N - Integrado: a partir de 2018;
         * T - Subsequente;
         * G - Graduação;
         * L - Lato Sensu;
         * E - Stricto Sensu;
         * 
         * F - ??? (A API não documenta o nível F, apesar de eu supor que seja FIC);
         */
        let tipoDeCurso: string;
        let tipoDeOferta: string;

        switch (course.nivel){
            case 'M':
            case 'N':
                tipoDeCurso = 'Técnico';
                //Testo se tem PROEJA no nome, para diferençar o integrado PROEJA do integrado ao ensino médio
                if(/proeja/.test(course.nome.toLowerCase()))
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
                //Para a graduação, verifico o grau acadêmico:
                /** 
                    * id_grau_academico -	descricao
                    * 8067070 -            LICENCIATURA;
                    * 2 -	                PROGRAMAS ESPECIAIS DE FORMAÇÃO PEDAGÓGICA;
                    * 1 -	                BACHARELADO;
                    * 4 -	                TECNOLOGIA;
                    */
                switch(course.id_grau_academico){
                    case 2: //A PNP considera como licenciatura o único curso desse tipo (e o título do grau nos dados do IFFar indicam o mesmo)
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

        return {tipoDeCurso, tipoDeOferta};
    }
    
    //Função com o uso exclusivo de tratar e localizar o respectivo nome do curso buscado na PNP. Essencial para poder criar a relação entre os dados abertos do IFFar e os dados da PNP
    private getPnpCourseName(course: Curso, pnpCourses: Array<PnpMatricula>): string{
        let pnpCoursesName: Array<string> = [];
        for(let i = 0; i < pnpCourses.length; i++){
            //Normalizo tanto o nome do curso dos dados do IFFar quanto os da PNP para remover caracteres especiais que afetem a comparação pela RegEx
            let normalizedName = this.normalizeString(pnpCourses[i].nomeDeCurso)
            let regex = new RegExp(normalizedName.toLowerCase(), 'u'); //
            console.log(regex)
            if(regex.test(this.normalizeString(course.nome).toLowerCase()))
                pnpCoursesName.push(pnpCourses[i].nomeDeCurso)
        }

        //Se tiver só um curso que retornou como positivo pela RegEx, retorno ele
        if(pnpCoursesName.length == 1)
            return pnpCoursesName[0];
        else{
            //Caso encontre mais de um nome de curso válido pela RegEx, reduzo o array para retornar o curso que tiver o nome mais comprido. O que for mais extenso é o correto
            return pnpCoursesName.reduce(function(a, b){
                return a.length >= b.length ? a : b;
            });
        }
    }

    private normalizeString(string: string): string{
        return string.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    }

}
