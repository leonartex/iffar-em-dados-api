// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import axios from "axios";

export default class GrausAcademicosController {
    public async get(id: number){
        let degree = axios
            .get(`https://dados.iffarroupilha.edu.br/api/v1/graus-academicos.json?id_grau_academico=${id}`)
            .then(res => {
                return res.data.data[0];
            })
            
        return degree;
    }
}
