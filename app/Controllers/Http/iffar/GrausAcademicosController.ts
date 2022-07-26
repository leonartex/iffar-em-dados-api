// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import GrauAcademico from "App/Models/iffar/GrauAcademico";
//import axios from "axios";

export default class GrausAcademicosController {
    public async get(id: number): Promise<GrauAcademico>{
        let url = 'graus-academicos.json?';
        url += 'id_grau_academico='+id
        let degree = AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data[0];
            })
            
        return degree;
    }
}
