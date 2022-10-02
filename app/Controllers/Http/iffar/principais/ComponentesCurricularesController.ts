// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import AxiosIffar from "@ioc:Axios/Iffar";
import ComponenteCurricular from "App/Models/iffar/principais/ComponenteCurricular";

export default class ComponentesCurricularesController {
    public async getCourse(courseId: number): Promise<Array<ComponenteCurricular>>{
        let url = 'componentes-curriculares.json?';
        url += 'id_tipo_componente=2&'; //Apenas pego as disciplinas pois são as que possuem nome bacana (se pegasse as Atividades também, viriam coisas genéricas como Estágio, TCC, etc.)
        url += 'id_curso='+courseId;

        let curricularComponents = await AxiosIffar.get(url)
            .then(res => {
                return res.data.data
            })
            .catch(error => console.log('Erro na req: '+error));

        return curricularComponents;
    }
}
