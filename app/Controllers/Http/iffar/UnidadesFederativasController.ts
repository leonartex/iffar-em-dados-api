// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

//import axios from "axios";

import UnidadeFederativa from "App/Models/iffar/UnidadeFederativa";
import AxiosIffar from "@ioc:Axios/Iffar";

export default class UnidadesFederativasController {
    public async get(stateId: number): Promise<UnidadeFederativa>{
        let url = 'unidades-federativas.json?';
        url += 'id_unidade_federativa='+stateId;
        const state: UnidadeFederativa = await AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data[0];
            })
            .catch(error => {
                console.error(error);
            });
        
        return state;
    }
}
