// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { types } from '@ioc:Adonis/Core/Helpers'

import Aluno from "App/Models/iffar/Aluno";
import axios from 'axios';

export default class AlunosController {
    //O offset é definido para, caso uma resposta traga um resultado com 10000 registros, ele recursivamente solicitar a lista com mais 10000 de offset, até não existir mais registros além deles
    //Se quiser pegar todos os alunos de determinado curso apenas é necessário não setar o atributo year
    public async getStudentsFromCourse(courseId: number, offset: number = 0, year?: number): Promise<Array<Aluno>>{
        let url = 'https://dados.iffarroupilha.edu.br/api/v1/alunos.json?';
        url += `id_curso=${courseId}&`;
        if(!types.isUndefined(year))
            url += `ano_ingresso=${year}&`;
        url += `offset=${offset}`;

        let students: Array<Aluno> = await axios 
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

        return students;
    }
}
