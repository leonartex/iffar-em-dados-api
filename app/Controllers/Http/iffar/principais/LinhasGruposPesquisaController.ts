// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import LinhaGrupoPesquisa from "App/Models/iffar/principais/LinhaGrupoPesquisa";

export default class LinhasGruposPesquisaController {
    public async getAll(): Promise<Array<LinhaGrupoPesquisa>>{
        let url = 'linhas-grupos-pesquisa.json?';
        let researchGroupMembers: Array<LinhaGrupoPesquisa> = await AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data;
            })
            .catch(error => console.log('Erro na req: '+error));

        return researchGroupMembers;
    }
}
