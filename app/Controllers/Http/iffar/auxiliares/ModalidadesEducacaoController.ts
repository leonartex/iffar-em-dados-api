// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import ModalidadeEducacao from "App/Models/iffar/auxiliares/ModalidadeEducacao";

export default class ModalidadesEducacaoController {
    public async get(modalityId: number): Promise<ModalidadeEducacao>{
        let url = 'modalidades-educacao.json?';
        url += 'id_modalidade_educacao='+modalityId;

        let modality = await AxiosIffar.get(url)
            .then(res => {
                return res.data.data[0]
            })
            .catch(error => console.log('Erro na req: '+error));

        return modality;
    }
}
