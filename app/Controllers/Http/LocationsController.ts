// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { DateTime } from 'luxon';

import util from 'util';
import axios from 'axios';
import turf from '@turf/turf';

import { types, base64 } from '@ioc:Adonis/Core/Helpers';

import Location from "App/Models/Location";
import Unit from 'App/Models/Unit';
import AxiosNominatim from '@ioc:Axios/Nominatim';


export default class LocationsController {
    public async get(unit: Unit): Promise<any> {
        // Se enviada a requisição de um estado (para poder desenhar o mapa), utiliza-se um objeto Unit com todos os dados nulos, exceto pelos dados do estado, para pegar a requisição            
        let url = ''; //A string que será montada para enviar a requisição para a API Nominatim
        if (types.isUndefined(unit.city)) {
            url = `?state=${encodeURIComponent(unit.state.stateName)}&country=Brasil&format=jsonv2&polygon_geojson=1&polygon_threshold=0.005`;
        } else {
            url = `?city=${encodeURIComponent(unit.city.cityName)}&state=${encodeURIComponent(unit.state.stateName)}&country=Brasil&format=jsonv2&polygon_geojson=1&polygon_threshold=0.005`;
        }

        //PRECISO VERIFICAR O CÓDIGO DA REQUISIÇÃO, PARA TER SIDO UM 200 INDICANDO SUCESSO, PARA TRATAR O ERRO QUANDO DER ERRADO A REQUISIÇÃO
        console.log('RUUUUUU: '+url)
        return await AxiosNominatim.get(url)
            .then(data => {
                return data.data;
            });
    }

    public locationToUnit(request: any): { coordinates: any, geojson: any } {
        console.log('LocationToUnit\n'+util.inspect(request) + '\n\n');

        //Pego os dados que realmente irei utilizar
        let coordinates: any = {
            lat: request[0].lat,
            lon: request[0].lon
        };
        let geojson = {
            "type": "Feature",
            "properties": {},
            "geometry": request[0].geojson
        }

        let location = {
            coordinates: coordinates,
            geojson: geojson
        }
        return location;
    }
}
