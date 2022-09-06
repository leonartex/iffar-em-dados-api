// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import AreaConhecimento from "App/Models/iffar/AreaConhecimento";
//import axios from "axios";

export default class AreasConhecimentoController {
    public async get(areaId: number): Promise<AreaConhecimento>{
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
