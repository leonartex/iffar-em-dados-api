import AxiosIffar from "@ioc:Axios/Iffar";
import TipoProjeto from "App/Models/iffar/TipoProjeto";

export default class TiposProjetosController{
    public async getAll(): Promise<Array<TipoProjeto>>{
        let url = 'tipos-projeto.json?';
        let projectsTypes = AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data;
            })
            
        return projectsTypes;
    }

    public async get(id: number): Promise<TipoProjeto>{
        let url = 'tipos-projeto.json?';
        url += 'id_tipo_projeto='+id;
        let projectsTypes = AxiosIffar
            .get(url)
            .then(res => {
                return res.data.data[0];
            })
            
        return projectsTypes;
    }
}