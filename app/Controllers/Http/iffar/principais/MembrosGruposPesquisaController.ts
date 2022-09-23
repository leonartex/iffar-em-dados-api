// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import MembroGrupoPesquisa from "App/Models/iffar/principais/MembroGrupoPesquisa";

export default class MembrosGruposPesquisaController {
    public async getAll(): Promise<Array<MembroGrupoPesquisa>>{
        let url = 'membros-grupos-pesquisa.json?';
        let researchGroupMembers: Array<MembroGrupoPesquisa> = await AxiosIffar
            .get(url)
            .then(res => {
                console.log('RG membros?')
                return res.data.data;
            })
            .catch(error => console.log('Erro na req: '+error));

        return researchGroupMembers;
    }

    public async get(researchGroupId: number): Promise<Array<MembroGrupoPesquisa>>{
        let url = 'membros-grupos-pesquisa.json?';
        url+= 'id_grupo_pesquisa='+researchGroupId;
        let researchGroupMembers: Array<MembroGrupoPesquisa> = await AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data;
            })
            .catch(error => console.log('Erro na req: '+error));

        return researchGroupMembers;
    }
}
