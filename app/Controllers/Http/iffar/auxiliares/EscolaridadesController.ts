// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import Escolaridade from "App/Models/iffar/auxiliares/Escolaridade";

export default class EscolaridadesController {

    public async getAll(): Promise<Array<Escolaridade>>{
        let url = 'escolaridades.json?';

        let educations = await AxiosIffar.get(url)
            .then(res => {
                return res.data.data
            })
            .catch(error => console.log('Erro na req: '+error));

        return educations;
    }

    public async get(educationId: number): Promise<Escolaridade>{
        let url = 'escolaridades.json?';
        url += 'id_escolaridade='+educationId;

        let education = await AxiosIffar.get(url)
            .then(res => {
                return res.data.data[0]
            })
            .catch(error => console.log('Erro na req: '+error));

        return education;
    }
}
