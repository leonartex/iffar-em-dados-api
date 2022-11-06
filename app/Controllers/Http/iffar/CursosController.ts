// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import Curso from "App/Models/iffar/Curso";
import UnidadeOrganizacional from "App/Models/iffar/UnidadeOrganizacional";
import UnidadesOrganizacionaisController from "./UnidadesOrganizacionaisController";
//import axios from "axios";

export default class CursosController {
    //Retorna todos os cursos
    public async getAll(): Promise<Array<Curso>>{
        let url = 'cursos.json?';
        let course: Array<Curso> = await AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data;
            })
            .catch(error => {
                console.error(error);
            });

        return course;
    }

    //Retorna todos os cursos específicos de uma unidade de ensino
    public async getAllFromUnit(unit: UnidadeOrganizacional): Promise<Array<Curso>>{
        let courses: Array<Curso> = [];

        //Pego todos os cursos para depois percorrer e filtrar os cursos pela unidade (a forma com melhor relação confiabilidade-praticidade que consegui pensar é verificar o município da unidade organizacional desse curso)
        let allCourses = await this.getAll();

        //Agora percorro a lista de cursos
        let unidadesC = new UnidadesOrganizacionaisController();
        for(let course of allCourses){
            let courseUnit = await unidadesC.get(course.id_unidade);

            //Se a unidade do curso possuir o mesmo município da unidade de ensino buscada, adiciona no vetor
            if(courseUnit.id_municipio == unit.id_municipio)
                courses.push(course);
        }

        return courses;
    }

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
