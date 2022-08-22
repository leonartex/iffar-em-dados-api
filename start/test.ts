import util from 'util';

import UnidadesOrganizacionaisController from "App/Controllers/Http/iffar/UnidadesOrganizacionaisController";
import CursosController from 'App/Controllers/Http/iffar/CursosController';
import MunicipiosController from 'App/Controllers/Http/iffar/MunicipiosController';
import GrausAcademicosController from 'App/Controllers/Http/iffar/GrausAcademicosController';

async function a() {
    const cursoC = new CursosController();
    let curso = await cursoC.get(62474);
    console.log(util.inspect(curso));

    const unidadeC = new UnidadesOrganizacionaisController()
    let unidade = await unidadeC.get(curso.id_unidade);
    console.log(util.inspect(unidade));

    const municipioC = new MunicipiosController();
    let municipio = await municipioC.get(unidade.id_municipio);
    console.log(util.inspect(municipio));

    const grauC = new GrausAcademicosController();
    let grau = await grauC.get(curso.id_grau_academico);
    console.log(util.inspect(grau));
    //Aqui se faz o tratamento do nome do curso, retornando o nome limpo necessário para bater com o nome no PNP. O nome dos cursos nos dados abertos do IFFar estão "sujos" com outras informações
    //Ex.: LICENCIATURA EM EDUCAÇÃO DO CAMPO - CIÊNCIAS AGRÁRIAS ou BACHARELADO EM ADMINISTRAÇÃO

    /** 
     * RegEx 
     */
}
a();