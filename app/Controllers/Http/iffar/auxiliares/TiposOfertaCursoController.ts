// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import TipoOfertaCurso from "App/Models/iffar/auxiliares/TipoOfertaCurso";

export default class TiposOfertaCursoController {
    public async get(offerTypeId: number): Promise<TipoOfertaCurso>{
        let url = 'tipos-oferta-curso.json?';
        url += 'id_tipo_oferta_curso='+offerTypeId;

        let offerType = await AxiosIffar.get(url)
            .then(res => {
                return res.data.data[0]
            })
            .catch(error => console.log('Erro na req: '+error));

        return offerType;
    }
}
