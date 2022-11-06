// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { types } from '@ioc:Adonis/Core/Helpers'
import AxiosIffar from '@ioc:Axios/Iffar';

import Aluno from "App/Models/iffar/Aluno";
//import axios from 'axios';

export default class AlunosController {
    //Retorna a lista de todos os estudantes do IFFar (lista GIGANTE)
    //O offset é definido para, caso uma resposta traga um resultado com 10000 registros, ele recursivamente solicitar a lista com mais 10000 de offset, até não existir mais registros além deles
    public async getStudents(offset: number = 0, year?: number): Promise<Array<Aluno>>{
        let url = 'alunos.json?';
        if(!types.isUndefined(year))
            url += `ano_ingresso=${year}&`;
        url += `offset=${offset}`;

        let students: Array<Aluno> = await AxiosIffar 
            .get(url)
            .then(res => {                    
                return res.data.data;
            })
            .catch(error => console.error(error))
        
        //Se ele tiver um comprimento de 10000 registros significa que provavelmente pode haver mais registros, que não foram retornados por conta do limite de registros por requisição da API
        if(students.length == 10000){
            if(!types.isUndefined(year))
                students = students.concat(await this.getStudents(offset+10000, year));
            else
                students = students.concat(await this.getStudents(offset+10000));
        }

        console.log('Total de estudantes: '+students.length);
        return students;
    }

    //Retorna os dados de estudantes de um conjunto de cursos. É para ser utilizado para retornar os estudantes específicos de uma unidade de ensino, porém, também permitindo uma flexibilidade para outros usos
    public async getStudentsFromCourses(coursesId: Array<number>, offset: number = 0, year?: number): Promise<Array<Aluno>>{
        //Podem ser utilizadas duas abordagens, onde eu não sei qual é a mais correta: pegar a lista de todos os estudantes e aí filtrar para os cursos daquela unidade (será necessário lidar com muitos registros); ou enviar as requisições por cada curso (pode ser necessário muitas requisições)
        let students: Array<Aluno> = [];
        for (let courseId of coursesId){
            students = students.concat(await this.getStudentsFromCourse(courseId));
        }

        console.log('Total de estudantes: '+students.length);
        return students;
    }

    public async getStudentsFromCourse(courseId: number, offset: number = 0, year?: number): Promise<Array<Aluno>>{
        let url = 'alunos.json?';
        url += `id_curso=${courseId}&`;
        if(!types.isUndefined(year))
            url += `ano_ingresso=${year}&`;
        url += `offset=${offset}`;

        let students: Array<Aluno> = await AxiosIffar 
            .get(url)
            .then(res => {                    
                return res.data.data;
            })
            .catch(error => console.error(error))
        
        //Se ele tiver um comprimento de 10000 registros significa que provavelmente pode haver mais registros, que não foram retornados por conta do limite de registros por requisição da API
        if(students.length == 10000){
            if(!types.isUndefined(year))
                students = students.concat(await this.getStudentsFromCourse(courseId, offset+10000, year));
            else
                students = students.concat(await this.getStudentsFromCourse(courseId, offset+10000));
        }

        console.log('Total de estudantes do curso: '+students.length);
        return students;
    }
}
