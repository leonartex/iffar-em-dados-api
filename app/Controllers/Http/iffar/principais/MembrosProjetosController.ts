import AxiosIffar from "@ioc:Axios/Iffar";
import MembroProjeto from "App/Models/iffar/principais/MembroProjeto";

export default class MembrosProjetosController{
    public async get(projectId: number): Promise<Array<MembroProjeto>>{
        let url = 'membros-projetos.json?';
        url+= 'id_projeto='+projectId;
        let projectMembers: Array<MembroProjeto> = await AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data;
            })
            .catch(error => console.log('Erro na req: '+error));

        return projectMembers;
    }
}