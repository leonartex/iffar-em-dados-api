// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import FormaIngresso from "App/Models/iffar/auxiliares/FormaIngresso";

export default class FormasIngressoController {
    public async getAll(): Promise<Array<FormaIngresso>>{
        let url = 'formas-ingresso.json?';
        let admissionTypes = await AxiosIffar.get(url)
            .then(res => {
                return res.data.data
            })
            .catch(error => console.log('Erro na req: '+error));

        return admissionTypes;
    }
}
