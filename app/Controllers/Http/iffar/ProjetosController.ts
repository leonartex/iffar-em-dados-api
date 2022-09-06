// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import util from 'util';

import Projeto from "App/Models/iffar/Projeto";
import UnidadeOrganizacional from "App/Models/iffar/UnidadeOrganizacional";
import axios from "axios";
import UnidadesOrganizacionaisController from "./UnidadesOrganizacionaisController";

export default class ProjetosController {
    //Retorna um único projeto (talvez nem seja utilizado)
    public async get(projectId: number): Promise<Projeto>{
        let url = 'https://dados.iffarroupilha.edu.br/api/v1/projetos.json?';
        url += 'id_projeto='+projectId;
        let project = await axios
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
        //Realizo a filtragem
        let i = 0;
        let projects = allProjects.filter(await async function(project){
            let projectUnit = await unidadesC.get(project.id_unidade);
            console.log(util.inspect(projectUnit.nome));
            console.log(i++);
            console.log('Municipio do projeto: '+projectUnit.id_municipio);
            console.log('Municipio do campus: '+campus.id_municipio);
            console.log(Date.now().toString())
            await async function(){setTimeout(await async function(){}, 1000);}
            console.log(Date.now().toString()+'\n')
            //Verifico se o id do municipio do
            return projectUnit.id_municipio == campus.id_municipio;
        })
        console.log(i);

        return projects;
    }

    //Retorna todos os projetos 
    public async getAll(): Promise<Array<Projeto>>{
        let url = 'https://dados.iffarroupilha.edu.br/api/v1/projetos.json?';
        let projects = await axios
            .get(url)
            .then(res => {
                return res.data.data
            })
            .catch(error => console.log(error));

        return projects;
    }

}
