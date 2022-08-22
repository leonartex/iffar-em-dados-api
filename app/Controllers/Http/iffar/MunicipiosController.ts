// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import axios from "axios";
import util from "util";

import Municipio from "App/Models/iffar/Municipio";
import UnidadesFederativasController from "./UnidadesFederativasController";

export default class MunicipiosController {
    public async get(cityId: number): Promise<Municipio>{
        let city = await axios
            .get(`https://dados.iffarroupilha.edu.br/api/v1/municipios.json?id_municipio=${cityId}`)
            .then(res => {
                return res.data.data[0]; //A API retorna um array com todos os resultados de cidade, então, como busco apenas uma, especifico o indíce 0
            })
            .catch(error => {
                console.error(error);
            });

        city.state = await new UnidadesFederativasController().get(city.id_unidade_federativa);
        
        return city;
    }
}
