// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import axios from "axios";
import util from "util";

import UnidadeOrganizacional from "App/Models/iffar/UnidadeOrganizacional";
import MunicipiosController from "./MunicipiosController";

export default class UnidadesOrganizacionaisController {
    public async listEducationalUnits(): Promise<Array<UnidadeOrganizacional>>{
        // Campus e campus avançado
        // unidade_responsavel=672     INSTITUTO FEDERAL FARROUPILHA
        let unitsCampus = await axios
            .get('https://dados.iffarroupilha.edu.br/api/v1/unidades-organizacionais.json?ativo=1&unidade_responsavel=672')
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

        let advancedCampi: Array<UnidadeOrganizacional>;
        let patternAdvanced = /campus avan[cç]ado/u;
        advancedCampi = campi.filter(function(unit){
            return patternAdvanced.test(unit.nome.toLowerCase());
        });
        
        //A lista de campi regulares é apenas a lista de campi com os campi avançados filtrados
        let regularCampi: Array<UnidadeOrganizacional>;
        regularCampi = campi.filter(function(unit){
            for(let i = 0; i < advancedCampi.length; i++){
                if(unit.id_unidade == advancedCampi[i].id_unidade)
                    return false;
            }

            return true;
        });

        //Monto o array final com todas as unidades, adicionando os seus tipos
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
        let unit = await axios
            .get(`https://dados.iffarroupilha.edu.br/api/v1/unidades-organizacionais.json?id_unidade=${unitId}`)
            .then(res => {
                return res.data.data[0];
            })
            .catch(error => {
                console.error(error);
            });

        return unit;
    }
}
