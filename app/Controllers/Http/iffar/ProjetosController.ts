// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import util from 'util';

import Projeto from "App/Models/iffar/Projeto";
import UnidadeOrganizacional from "App/Models/iffar/UnidadeOrganizacional";
import axios from "axios";
import UnidadesOrganizacionaisController from "./UnidadesOrganizacionaisController";

import AxiosIffar from '@ioc:Axios/Iffar';

export default class ProjetosController {
    //Retorna um único projeto (talvez nem seja utilizado)
    public async get(projectId: number): Promise<Projeto>{
        let url = 'projetos.json?';
        url += 'id_projeto='+projectId;
        let project = await AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data[0]
            })
            .catch(error => console.log(error));

        return project;
    }

    //Pega todos os projetos de uma única unidade (campus, para deixar mais claro)
    //Precisa ser a UnidadeOrganizacional por causa que é necessário pegar a info do município e se não seria necessário enviar uma outra requisição só pra pegar a info da unidade
    //Utiliza 
    public async getFromUnit(campus: UnidadeOrganizacional){
        //Como a comparação é realizada pelo município, já que um projeto de um mesmo campus pode estar registrado em diferentes unidades organizacionais dentro desse campus, é necessário requisitar tudo, para depois filtrar
        let allProjects = await this.getAll();
        
        const unidadesC = new UnidadesOrganizacionaisController();
        //Realizo a filtragem (filter não é async, então tenho que fazer na mão a filtragem). O lado negativo de realizar dessa forma a filtragem é que é necessário esperar a resposta de uma requisição para poder seguir para o outro projeto, demorando bastante caso não haja cache (por sorte, há)
        let projects: Array<Projeto> = [];
        for(let i = 0; i < allProjects.length; i++){
            console.log(i)
            let projectUnit = await unidadesC.get(allProjects[i].id_unidade);
            //Verifico se o id do municipio do
            if(projectUnit.id_municipio == campus.id_municipio)
                projects.push(allProjects[i]);
        }

        return projects;
    }

    //Retorna todos os projetos 
    public async getAll(): Promise<Array<Projeto>>{
        let url = 'projetos.json?';
        let projects = await AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data
            })
            .catch(error => console.log(error));

        return projects;
    }

}
