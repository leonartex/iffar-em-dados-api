// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import Servidor from "App/Models/iffar/principais/Servidor";

export default class ServidoresController {
    //Nem sei se preciso adicionar um método para pegar todos sem distinção, visto que, na página inicial (que trata do IFFar como um todo), eu já vou precisar mandar um getFromUnit para cada unidade de ensino.
    public async getAll(){}

    public async getFromUnit(unitId: number): Promise<Array<Servidor>>{
        let url = 'servidores.json?';
        url += 'id_unidade_lotacao='+unitId;

        let servants = await AxiosIffar.get(url)
            .then(res => {
                return res.data.data
            })
            .catch(error => console.log('Erro na req: '+error));

        return servants;
    }
}
