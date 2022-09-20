import { string, types } from '@ioc:Adonis/Core/Helpers';
import PnpMatricula from 'App/Models/PnpMatricula';

import axios from 'axios';
import util from 'util';

const fs = require('fs');
import {parse} from 'csv-parse';

let c = {data: []}

console.log(`######################################################\n\n\n`)
for (let p in c.data[0]){
    console.log(`public ${p}: string`)
}
console.log(`######################################################\n\n\n`)

//Função pra ver todos os arquivos existentes na pasta pnp, para identificar todos os dados que se têm, seguindo o padrão de nome pnp-NOMEDOSMICRODADOS-ANOBASE
//Aí chama a respectiva função para cada ano base
let cities:Array<{code: string, name:string}> = [];

//pnp2020();

async function pnp2020(){
    //Primeiro se verifica se já não foram registrados os dados desse ano, para garantir que será executado apenas na primeira vez o registro deles. 
    //Verificação é realizada para cada microdado possível (atualmente apenas matriculas, mas podem ter outras adicionadas no futuro)

    // await PnpMatricula
    //     .query()
    //     .where('ano_base', '2020')
    //     .delete()

    const hasMatricula = await PnpMatricula
        .query()
        .where('anoBase', '2020')
        .first();

    if(types.isNull(hasMatricula)){
        //Carrega então o arquivo com os microdados
        const rows = fs.createReadStream('./tmp/pnp/pnp-matriculas-2020.csv')
        .pipe(parse({ delimiter: ';', columns: true}))

        for await (const row of rows){
            await registerEnrollment(row);
        }
    }
    
}

function hasCity(cityCode: string): boolean{
    //Se não tiver cidade alguma ainda no array, retorna falso para indicar que pode mandar requisição
    if(cities.length == 0)
        return false;

    for(let i = 0; i < cities.length; i++){
        if(cities[i].code == cityCode)
            return true;
    }

    return false;
}

function getCityName(cityCode: string): string {
    let city = cities.filter(function(city){
        if(city.code == cityCode)
            return true;
        else
            return false;
     })[0]
    return city.name;
}

async function registerEnrollment(row){
    //Registra a matricula apenas se for do IFFar
    if(row['Instituição'] == 'IF FARROUPILHA'){
        //Cria o objeto PnpMatricula que será salvo no banco (SQLite)
        let matricula = new PnpMatricula();
        matricula.anoBase = '2020';

        //Já que a estrutura do PnpMatricula leva como base a PNP do ano base de 2020, aqui apenas normaliza-se e converte-se para camelCase o nome da propriedade para adicionar ao objeto, desconsiderando as exceções
        for(let property in row){
            //Normalizo o nome da propriedade, para remover acentuação sem perder os caracteres
            let propertyNormalized = property.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            let propertyCamelCase = string.camelCase(propertyNormalized);
            
            //Verificam-se os campos a serem ignorados
            if(propertyCamelCase == 'matricula_2019') continue
            //if(propertyCamelCase == 'propertyName') continue ...

            //Adiciona-se o valor do campo da matricula do CSV para o PnpMatricula
            matricula[propertyCamelCase] = row[property];                
        }

        //Já que a PNP de anos base 2020 não tem o nome do município, apenas o código do IBGE, utilizo a API do IBGE para pegar o nome da cidade e então registrar junto
        //console.log("Cidade: "+matricula.codigoDoMunicipioComDv)

        let municipio: {nome: string};
        if(!hasCity(matricula.codigoDoMunicipioComDv)){
            //console.log('Deu erro no !hasCity')
            console.log(util.inspect(cities))
            municipio = await axios
                .get(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${matricula.codigoDoMunicipioComDv}`)
                .then(res => {
                    //setTimeout(function(){console.log('Deu certo')}, 100);
                    return res.data;
                })
                .catch(err => {
                    console.log(util.inspect(row))
                    console.log("Cidade com erro: "+matricula.codigoDoMunicipioComDv)
                    console.log('ERRO: '+err.statusCode)
                })
            cities.push({code: matricula.codigoDoMunicipioComDv, name: municipio.nome})
        }else{
            //console.log('Deu erro no else !hasCity')
            municipio = {nome: getCityName(matricula.codigoDoMunicipioComDv)};
        }

        matricula.nomeMunicipio = municipio.nome;

        await matricula.save()
    }
}