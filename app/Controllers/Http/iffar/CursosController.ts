// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import Curso from "App/Models/iffar/Curso";
//import axios from "axios";

export default class CursosController {
    public async getAll(){};

    public async getAllFromUnit(unitId: number){};

    public async get(courseId: number): Promise<Curso>{
        let url = 'cursos.json?';
        url += 'id_curso='+courseId;
        let course = await AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data[0];
            })
            .catch(error => {
                console.error(error);
            });

        return course;
    };
}
