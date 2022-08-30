import util from 'util';

import { types } from '@ioc:Adonis/Core/Helpers';

import UnidadesOrganizacionaisController from "App/Controllers/Http/iffar/UnidadesOrganizacionaisController";
import CursosController from 'App/Controllers/Http/iffar/CursosController';
import PnpMatriculasController from 'App/Controllers/Http/pnp/PnpMatriculasController';

a();

async function a() {
    const cursosC = new CursosController();
    let course = await cursosC.get(66658);

    const pnpMatriculasC = new PnpMatriculasController();
    await pnpMatriculasC.getCourse(course);

    // let matriculas = await pnpMatriculasC.getIffar();
    // console.log('Matriculas registradas: '+matriculas.length);

    const unidadesC = new UnidadesOrganizacionaisController()
    let unit = await unidadesC.get(41);
    let matriculas = await pnpMatriculasC.getUnit(unit);
    console.log('Matriculas registradas: '+matriculas.length);
    
}