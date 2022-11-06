// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

//import axios from "axios";
import AxiosIffar from '@ioc:Axios/Iffar';
import util from "util";


import UnidadeOrganizacional from "App/Models/iffar/UnidadeOrganizacional";
import MunicipiosController from "./MunicipiosController";
import Curso from 'App/Models/iffar/Curso';

export default class UnidadesOrganizacionaisController {
    public async getEducationalUnits(): Promise<Array<UnidadeOrganizacional>>{
        // Campus e campus avançado
        // unidade_responsavel=672     INSTITUTO FEDERAL FARROUPILHA
        let unitsCampus = await AxiosIffar
            .get('unidades-organizacionais.json?ativo=1&unidade_responsavel=672')
            .then(res => {
                return res.data.data
            })
            .catch(error => {
                console.error(error);
            });

        //Após recuperar a lista de unidades organizacionais, filtra-se para selecionar campi e campi avançados
        //Primeiro seleciono todas as unidades que sejam campus (possuem campus no nome), para depois filtrar entre campus avançado e campus regular (o campus normal, que não sei se possui um nome mais correto)
        let campi: Array<UnidadeOrganizacional>;
        let patternCampus = /campus/u;
        campi = unitsCampus.filter(function(unit){
            return patternCampus.test(unit.nome.toLowerCase());
        });

        //Campi avançados sempre estarão contido na lista de campi, daí é só filtrar essa lista de campi para se ter a lista de campi avançados
        let advancedCampi: Array<UnidadeOrganizacional>;
        let patternAdvanced = /campus avan[cç]ado/u;
        advancedCampi = campi.filter(function(unit){
            return patternAdvanced.test(unit.nome.toLowerCase());
        });
        
        //A lista de campi regulares é apenas a lista de campi com os campi avançados removidos
        let regularCampi: Array<UnidadeOrganizacional>;
        regularCampi = campi.filter(function(unit){
            for(let i = 0; i < advancedCampi.length; i++){
                if(unit.id_unidade == advancedCampi[i].id_unidade)
                    return false;
            }

            return true;
        });

        //Monto o array final com todas as unidades, adicionando os seus específicos tipos
        let units: Array<UnidadeOrganizacional> = [];
        regularCampi.forEach(unit => arrayUnits(unit, 'campus'));
        advancedCampi.forEach(unit => arrayUnits(unit, 'advanced-campus'));
        
        //A função adiciona o tipo de unidade na hora de adicionar no array final de unidades
        function arrayUnits(unit: UnidadeOrganizacional, type: string){
            unit.type = type;
            units.push(unit);
        }

        for(let i = 0; i < units.length; i++)
            units[i].city = await new MunicipiosController().get(units[i].id_municipio);

        return units;
    }

    public async get(unitId: number): Promise<UnidadeOrganizacional>{
        let url = 'unidades-organizacionais.json?';
        url += 'id_unidade='+unitId;
        let unit = await AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data[0];
            })
            .catch(error => {
                console.error(error);
            });

        return unit;
    }

    public async getUnitFromCourse(course: Curso): Promise<UnidadeOrganizacional>{
        let unit: UnidadeOrganizacional = await this.get(course.id_unidade)
        
        //Já retorno com o nome do município já que, quando eu uso este método, minha intenção é pegar a cidade
        unit.city = await new MunicipiosController().get(unit.id_municipio);

        return unit;
    }
}
