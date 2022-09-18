// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import GrupoPesquisa from "App/Models/iffar/principais/GrupoPesquisa";

export default class GruposPesquisasController {
    public async getAll(): Promise<Array<GrupoPesquisa>>{
        let url = 'grupos-pesquisa.json?';
        let researchGroups = await AxiosIffar.get(url)
            .then(res => {
                return res.data.data;
            })
            .catch(error => console.log('Erro na req: '+error));

        return researchGroups;
    }
}
