// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AreaConhecimento from "App/Models/iffar/AreaConhecimento";
import axios from "axios";

export default class AreasConhecimentoController {
    public async get(areaId: number): Promise<AreaConhecimento>{
        let url = 'https://dados.iffarroupilha.edu.br/api/v1/eixos-conhecimento.json?';
        url += 'id_eixo_conhecimento='+areaId;
        let area = await axios
            .get(url)
            .then(res => {
                return res.data.data[0]
            })
            .catch(error => console.log(error));

        return area;
    }
}
