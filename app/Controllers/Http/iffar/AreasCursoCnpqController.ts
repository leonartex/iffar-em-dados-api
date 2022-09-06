// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AreaCursoCnpq from "App/Models/iffar/AreaCursoCnpq";
import axios from "axios";

export default class AreasCursoCnpqController {
    public async get(areaId: number): Promise<AreaCursoCnpq>{
        let url = 'https://dados.iffarroupilha.edu.br/api/v1/areas-curso-cnpq.json?';
        url += 'id_area_conhecimento_cnpq='+areaId;
        let area = await axios
            .get(url)
            .then(res => {
                return res.data.data[0]
            })
            .catch(error => console.log(error));

        return area;
    }
}
