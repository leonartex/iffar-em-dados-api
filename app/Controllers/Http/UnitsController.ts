/**
 * Esse controlador faz a ligação entre as unidades organizacionais dos 
 * dados abertos do IFFar junto com os dados sobre local, necessário para o mapa, 
 * e a preparação para o front-end
 */

// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import util from 'util';
import { polygon, rewind } from '@turf/turf';

import Unit from 'App/Models/Unit';
import UnidadeOrganizacional from 'App/Models/iffar/UnidadeOrganizacional';
import UnidadesOrganizacionaisController from './iffar/UnidadesOrganizacionaisController';
import LocationsController from './LocationsController';

export default class UnitsController {
    
    // Retorna uma lista de unidades organizacionais não tratadas
    public async list(): Promise<Array<Unit>> {
        let units = await new UnidadesOrganizacionaisController().getEducationalUnits();

        let builtUnits: Array<Unit> = [];

        //"Construo" a unidade do tipo UnidadeOrganizacional para o tipo Unit e adiciono no array para retornar esse array no final
        for(let i = 0; i < units.length; i++){
           let finalUnit = await this.build(units[i]);
           builtUnits.push(finalUnit);
        }

        return builtUnits;
    }

    //Prepara a lista de unidades organizacionais. Transforma em Units e adiciona os dados de Location
    public async build(unit: UnidadeOrganizacional): Promise<Unit>{
        let finalUnit = new Unit();

        finalUnit.apiId = unit.id_unidade;
        finalUnit.name = unit.nome;
        finalUnit.type = unit.type;
        
        finalUnit.city = {
            cityId: unit.city.id_municipio,
            cityName: unit.city.nome,
        };
        finalUnit.state = {
            stateId: unit.city.state.id_unidade_federativa,
            stateName: unit.city.state.descricao,
            stateInitials: unit.city.state.sigla
        }

        let location = await new LocationsController()
            .get(finalUnit);
        let locationReq = location;

        // console.log("###############################")
        // console.log("Location: "+util.inspect(locationReq));
        // console.log("###############################\n\n")

        let coordinates = {
            lat: locationReq[0].lat,
            lon: locationReq[0].lon
        }

        //Pego as coordenadas do geojson para poder transformar elas em um polygon, por causa que o geojson da resposta do Nominatim no formato jsonv2 não vem com todas as informações que um geojson necessita para passar pelo rewind e desenhar em um gráfico do D3
        let geojson = polygon(locationReq[0].geojson.coordinates);
        //As coordenadas precisam ser invertidas por conta que o D3 usa coordenadas elipsoidais ao invés de cartesianas, por isso passam pelo rewind antes. Fonte: https://stackoverflow.com/questions/49311001/d3-js-drawing-geojson-incorrectly
        geojson = rewind(geojson,{reverse:true});
        finalUnit.location = {
            coordinates: coordinates,
            geojson: geojson
        };

        return finalUnit;
    }
}
