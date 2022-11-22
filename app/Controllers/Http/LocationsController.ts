// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { DateTime } from 'luxon';

import util from 'util';
import axios from 'axios';
import turf from '@turf/turf';

import { types, base64 } from '@ioc:Adonis/Core/Helpers';

import Location from "App/Models/Location";
import Unit from 'App/Models/Unit';


export default class LocationsController {
    public async get(unit: Unit): Promise<Location>{
        //await (await Location.findByOrFail('apiId', 9273)).delete();

        let thisLocation: Location | null;
        
        // Se enviada a requisição de um estado (para poder desenhar o mapa), utiliza-se um objeto Unit com todos os dados nulos, exceto pelos dados do estado, para pegar a requisição
        console.log(util.inspect(unit))
        if(types.isUndefined(unit.city)){
            thisLocation = await Location
                .query()
                .where('apiId', unit.state.stateId)
                .where('locationType', 'state')
                .first();
        }else{
            thisLocation = await Location
                .query()
                .where('apiId', unit.city.cityId)
                .where('locationType', 'city')
                .first();
        }

        if(types.isNull(thisLocation)){
            let location = new Location();
            
            let url = 'https://nominatim.openstreetmap.org/search?'; //A string que será montada para enviar a requisição para a API Nominatim

            if(types.isUndefined(unit.city)){
                location.apiId = unit.state.stateId;
                location.name = unit.state.stateName;
                location.locationType = 'state';

                url += `state=${encodeURIComponent(unit.state.stateName)}&country=Brasil&format=jsonv2&polygon_geojson=1&polygon_threshold=0.005`;
            }else{
                location.apiId = unit.city.cityId;
                location.name = unit.city.cityName;
                location.locationType = 'city';

                url += `city=${encodeURIComponent(unit.city.cityName)}&state=${encodeURIComponent(unit.state.stateName)}&country=Brasil&format=jsonv2&polygon_geojson=1&polygon_threshold=0.005`;
            }

            console.log("###############################")
            console.log("URL: "+util.inspect(url));
            console.log("###############################\n\n")
            
            const lastRequest = await Location
                .query()
                .orderBy('requestTime', 'desc')
                .first()
            
            //Verifico se existe algum registro já no banco. Se este não for a primeira requisição no banco, verifica a diferença de tempo entra essa e a última requisição, para não contradizer as regras de uso do Nominatim
            if(!types.isNull(lastRequest)){
                await this.waitingTime();
            }else{
                let l = new Location();
                l.requestTime = DateTime.now();
                l.save();
                await this.waitingTime();
            }

            //Salvo no banco o Location antes de enviar a requisição para o Nominatim, atualizando o elemento após o recebimento da resposta
                //Isso diminui o risco de outra requisição ser enviada em um intervalo menor que 1 segundo por ainda não se ter registrado o Location, por causa de ainda não ter recebido a resposta do Nominatim
                //A chance de ocorrer isso é extremamente baixa, considerando que quase nunca as unidades serão atualizadas e que, depois de listar todas as unidades de Campi, etc., o back-end vai pegar do SQLite
            location.requestTime = DateTime.now();
            await location.save();

            //Transformo em string a resposta da requisição, para pode salva no banco. O parse para JSON novamente deverá ser feito pelo UnitsController
            //PRECISO VERIFICAR O CÓDIGO DA REQUISIÇÃO, PARA TER SIDO UM 200 INDICANDO SUCESSO, PARA TRATAR O ERRO QUANDO DER ERRADO A REQUISIÇÃO

            location.request = JSON.stringify(await axios.get(url)
                .then(data => {
                    return data.data;
                })
            );
            await location.save();
            
            return location;
        }else{
            return thisLocation;
        }
    }

    public async waitingTime() {
        let lastRequest = await Location
            .query()
            .orderBy('requestTime', 'desc')
            .first()

        if(!types.isNull(lastRequest)){
            let differenceTime = DateTime.now().diff(lastRequest.requestTime);
            let differenceMilliseconds = differenceTime.as('milliseconds');
            console.log('Milliseconds: '+differenceMilliseconds)
            if(differenceMilliseconds < 1000){
                setTimeout(() => {}, 1000 - differenceMilliseconds);
                //Verifica novamente, para caso outra requisição tenha sido enviada durante esse tempo de espera
                this.waitingTime();

                //Preciso pensar em uma forma de garantir que uma requisição não fique eternamente na fila por sempre vir uma outra requisição antes de passar o intervalo desta
            }
        }
    }

    public locationToUnit(request: Location['request']): {coordinates: any, geojson: any}{
        let req: any = JSON.parse(request);
        console.log(util.inspect(req)+'\n\n');

        //Pego os dados que realmente irei utilizar
        let coordinates: any = {
            lat: req[0].lat,
            lon: req[0].lon
        };
        let geojson = {
            "type": "Feature",
            "properties": {},
            "geometry": req[0].geojson
        }
        
        let location = {
            coordinates: coordinates,
            geojson: geojson
        }
        return location;
    }
}
