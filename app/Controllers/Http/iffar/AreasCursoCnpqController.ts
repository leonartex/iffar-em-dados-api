// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import AreaCursoCnpq from "App/Models/iffar/AreaCursoCnpq";
//import axios from "axios";

export default class AreasCursoCnpqController {
    public async get(areaId: number): Promise<AreaCursoCnpq>{
        let url = 'areas-curso-cnpq.json?';
        url += 'id_area_conhecimento_cnpq='+areaId;
        let area = await AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data[0]
            })
            .catch(error => console.log(error));

        return area;
    }
}
