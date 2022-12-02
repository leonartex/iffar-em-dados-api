/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/

import Event from '@ioc:Adonis/Core/Event'
import CursosController from 'App/Controllers/Http/iffar/CursosController';
import UnidadesOrganizacionaisController from 'App/Controllers/Http/iffar/UnidadesOrganizacionaisController';
import PagesController from 'App/Controllers/Http/PagesController';
import StringService from 'App/Services/stringService';

Event.on('renewCache', async () => {
    console.log('Renovando o cache');
    let pagesP = new PagesController();

    //Renovo o cache da página geral do IFFar
    pagesP.getAll(true);

    //Renovo o cache das páginas de todas as unidades
    let unitsC = new UnidadesOrganizacionaisController();
    let educationalUnits = await unitsC.getEducationalUnits();
    educationalUnits.forEach(unit => pagesP.getUnit(StringService.portugueseTitleCase(unit.city.nome), true));

    //Renovo o cache das páginas de todos os cursos (técnico, graduação, pós-graduação)
    let cursosC = new CursosController();
    let apiCourses = (await cursosC.getAll()).filter(course => course.nivel != "F");
    apiCourses.forEach(course => pagesP.getCourse(course.id_curso, true));
})

function emitRenewCache() {
    Event.emit('renewCache', null);
}
setInterval(emitRenewCache, (2 * 24 * 60 * 60) - (2 * 60 * 60)); //Renovo o cache 2 horas antes do cache vencer