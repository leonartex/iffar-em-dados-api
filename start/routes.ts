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
import { string } from '@ioc:Adonis/Core/Helpers';

import util from 'util';

import Route from '@ioc:Adonis/Core/Route'
import LocationsController from 'App/Controllers/Http/LocationsController';
import Unit from 'App/Models/Unit';
import UnidadesOrganizacionaisController from 'App/Controllers/Http/iffar/UnidadesOrganizacionaisController';
import UnitsController from 'App/Controllers/Http/UnitsController';

Route.get('/api/location', async () => {
  let unit = new Unit();
  unit.city.cityId = 8883;
  unit.state.stateId = 43;
  unit.city.cityName = "Frederico Westphalen";
  unit.state.stateName = "Rio Grande do Sul";
  let location = await new LocationsController().get(unit);

  // console.log("###############################")
  // console.log(util.inspect(location));
  // console.log("###############################\n\n")
  return {data: location};
});

Route.get('/api/unidadesList', async () => {
  let units = await  new UnitsController().list()

  return {data: units};
});

Route.get('/api/curso', async () => {
  const fs = require('fs');
  const {parse} = require('csv-parse');

  console.log("###############################\n\n")
  // fs.createReadStream('./tmp/pnp/test.csv')
  //     .pipe(parse({ delimiter: ';', columns: true}))
  //     .on('data', function(row){
  //       console.log("###############################\n\n")
  //       for(let property in row){
  //           //Normalizo o nome da propriedade, para remover acentuação sem perder os caracteres
  //           let propertyNormalized = property.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  //           let text = `table.string('${string.snakeCase(propertyNormalized)}')`;
  //           console.log(text);
  //       }
  //     })

})
