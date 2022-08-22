// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import axios from "axios";

import UnidadeFederativa from "App/Models/iffar/UnidadeFederativa";

export default class UnidadesFederativasController {
    public async get(stateId: number): Promise<UnidadeFederativa>{
        const state: UnidadeFederativa = await axios
            .get(`https://dados.iffarroupilha.edu.br/api/v1/unidades-federativas.json?id_unidade_federativa=${stateId}`)
            .then(res => {
                return res.data.data[0];
            })
            .catch(error => {
                console.error(error);
            });
        
        return state;
    }
}
