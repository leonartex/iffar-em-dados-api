/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Application from '@ioc:Adonis/Core/Application'
import { string, types } from '@ioc:Adonis/Core/Helpers';

import util from 'util';

import Route from '@ioc:Adonis/Core/Route'
import LocationsController from 'App/Controllers/Http/LocationsController';
import Unit from 'App/Models/Unit';
import UnidadesOrganizacionaisController from 'App/Controllers/Http/iffar/UnidadesOrganizacionaisController';
import UnitsController from 'App/Controllers/Http/UnitsController';
import PagesController from 'App/Controllers/Http/PagesController';


// Route.get('/api/location', async () => {
//   let unit = new Unit();
//   unit.city = {
//     cityId: 8883,
//     cityName: "Frederico Westphalen"
//   };
//   unit.state = {
//     stateId: 43,
//     stateName: "Rio Grande do Sul",
//     stateInitials: 'RS'
//   };

//   let location = await new LocationsController().get(unit);

//   // console.log("###############################")
//   // console.log(util.inspect(location));
//   // console.log("###############################\n\n")
//   return {data: location};
// });

// Route.get('/api/unidadesList', async () => {
//   let units = await  new UnitsController().list()

//   return {data: units};
// });

Route.get('/api/iffar', async ({response}) => {
  try{
    let pagesC = new PagesController();
    let iffarInfo = await pagesC.getAll();

    response.status(200);
    response.send(iffarInfo);
  }catch(error){
    response.status(500);
    response.send({message: 'Erro ao processar os dados', error});
  }
  

})

Route.get('/api/unit/:city', async ({params, response}) => {
  try{
    let pagesC = new PagesController();
    let unitInfo = await pagesC.getUnit(params.city);
  
    if(types.isUndefined(unitInfo)){
      response.status(404);
      response.send({message: 'Unidade de ensino não encontrada ou não existente'})
      return response
    }else{
      response.status(200);
      response.send(unitInfo);
    }
  }catch(error){
    response.status(500);
    response.send({message: 'Erro ao processar os dados da unidade de ensino', error});
  }
  
  
})

Route.get('/api/course/:id', async ({params, response}) => {
  try{
    let pagesC = new PagesController();
    let courseInfo = await pagesC.getCourse(params.id);
  
    if(types.isUndefined(courseInfo) || types.isError(courseInfo)){
      response.status(404);
      response.send('Curso não encontrado, não existente ou problema ocasionado nos dados abertos da instituição')
      return response;
    }else{
      response.status(200);
      response.send(courseInfo);
    }
  }catch(error){
    response.status(500);
    response.send('Erro ao processar os dados do curso');
  }

}).where('id', Route.matchers.number())

Route.get('/api/teste', async () => {
  let pagesC = new PagesController();
  let units = await pagesC.teste();

  return units;
})
