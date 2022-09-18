// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import EixoConhecimento from "App/Models/iffar/EixoConhecimento";
//import axios from "axios";

export default class EixosConhecimentoController {
    public async get(areaId: number): Promise<EixoConhecimento>{
        let url = 'eixos-conhecimento.json?';
        url += 'id_eixo_conhecimento='+areaId;
        let area = await AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data[0]
            })
            .catch(error => console.log(error));

        return area;
    }
}
