// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Curso from "App/Models/iffar/Curso";
import axios from "axios";

export default class CursosController {
    public async getAll(){};

    public async getAllFromUnit(unitId: number){};

    public async get(courseId: number): Promise<Curso>{
        let course = await axios
            .get(`https://dados.iffarroupilha.edu.br/api/v1/cursos.json?id_curso=${courseId}`)
            .then(res => {
                return res.data.data[0];
            })
            .catch(error => {
                console.error(error);
            });

        return course;
    };
}
