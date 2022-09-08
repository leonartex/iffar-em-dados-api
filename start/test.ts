import util from 'util';

import { types } from '@ioc:Adonis/Core/Helpers';

import UnidadesOrganizacionaisController from "App/Controllers/Http/iffar/UnidadesOrganizacionaisController";
import CursosController from 'App/Controllers/Http/iffar/CursosController';
import PnpMatriculasController from 'App/Controllers/Http/pnp/PnpMatriculasController';
import AlunosController from 'App/Controllers/Http/iffar/AlunosController';
import ProjetosController from 'App/Controllers/Http/iffar/ProjetosController';

import AxiosIffar from '@ioc:Axios/Iffar';
import LastRequestIffar from '@ioc:LastRequest/Iffar';

import Redis from '@ioc:Adonis/Addons/Redis';

a();

async function a() {
    const unidadesC = new UnidadesOrganizacionaisController();
    let campus = await unidadesC.get(41);
    console.log('Campus: '+util.inspect(campus.nome));

    const projetosC = new ProjetosController();
    let projetos = await projetosC.getFromUnit(campus);
    console.log(util.inspect(projetos[0]));

    // console.log('LastRequest: '+LastRequestIffar.lastRequestTime);
    // LastRequestIffar.updateTime(Date.now());
    // console.log('LastRequest atualizado: '+LastRequestIffar.lastRequestTime);

    // let cursos = await AxiosIffar.get('cursos.json?nivel=G')
    // console.log('Cursos: '+cursos.data.data.length);

    // let cursosT = await AxiosIffar.get('cursos.json?nivel=T')
    // console.log('Cursos T: '+cursosT.data.data.length);

    // cursosT.data.data.forEach(curso => {
    //     AxiosIffar.get('cursos.json?nivel=T&id_curso='+curso.id_curso)
    //         .then(res => {
    //             console.log(res.data.data[0].nome+'\n');
    //         })
    // });

    // const cursosC = new CursosController();
    // let course = await cursosC.get(66658);

    // const alunosC = new AlunosController();
    // let alunos = await alunosC.getStudentsFromCourse(course.id_curso, 0, 2020);
    // console.log("Total de alunos: "+alunos.length)

    // const pnpMatriculasC = new PnpMatriculasController();
    // let pnpCourse = await pnpMatriculasC.getCourse(course);

    // let matriculas = await pnpMatriculasC.getIffar();
    // console.log('Matriculas registradas: '+matriculas.length);

    // const unidadesC = new UnidadesOrganizacionaisController()
    // let unit = await unidadesC.get(41);
    // let matriculas = await pnpMatriculasC.getUnit(unit);
    // console.log('Matriculas registradas: '+matriculas.length);
    
}