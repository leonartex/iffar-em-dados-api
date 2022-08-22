import { string, types } from '@ioc:Adonis/Core/Helpers';
import PnpMatricula from 'App/Models/PnpMatricula';

import axios from 'axios';
import util from 'util';

const fs = require('fs');
const {parse} = require('csv-parse');

let c = {data: []}

console.log(`######################################################\n\n\n`)
for (let p in c.data[0]){
    console.log(`public ${p}: string`)
}
console.log(`######################################################\n\n\n`)

//Função pra ver todos os arquivos existentes na pasta pnp, para identificar todos os dados que se têm, seguindo o padrão de nome pnp-NOMEDOSMICRODADOS-ANOBASE
//Aí chama a respectiva função para cada ano base
pnp2020();

async function pnp2020(){
    //Primeiro se verifica se já não foram registrados os dados desse ano, para garantir que será executado apenas na primeira vez o registro deles. 
    //Verificação é realizada para cada microdado possível (atualmente apenas matriculas, mas podem ter outras adicionadas no futuro)

    const hasMatricula = await PnpMatricula
        .query()
        .where('anoBase', '2020')
        .first();

    if(types.isNull(hasMatricula)){
        //Carrega então o arquivo com os microdados
        fs.createReadStream('./tmp/pnp/test.csv')
        .pipe(parse({ delimiter: ';', columns: true}))
        .on('data', async function(row){
            //Registra a matricula apenas se for do IFFar
            if(row['Instituição'] == 'IF FARROUPILHA'){
                //Cria o objeto PnpMatricula que será salvo no banco (SQLite)
                let matricula = new PnpMatricula();
                matricula.anoBase = '2020';

                //Já que a estrutura do PnpMatricula leva como base o PNP do ano base de 2020, aqui apenas normaliza-se e converte-se para camelCase o nome da propriedade para adicionar ao objeto, desconsiderando as exceções
                for(let property in row){
                    //Normalizo o nome da propriedade, para remover acentuação sem perder os caracteres
                    let propertyNormalized = property.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    let propertyCamelCase = string.camelCase(propertyNormalized);
                    
                    //Verificam-se os campos a serem ignorados
                    if(propertyCamelCase == 'matricula_2019') continue

                    //Adiciona-se o valor do campo da matricula do CSV para o PnpMatricula
                    matricula[propertyCamelCase] = row[property];                
                }

                //Já que o PNP de anos base 2020 não tem o nome do município, apenas o código do IBGE, utilizo a API do IBGE para pegar o nome da cidade e então registrar junto
                let municipio = await axios
                    .get(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${matricula.codigoDoMunicipioComDv}`)
                    .then(res => {
                        return res.data;
                    })
                matricula.nomeMunicipio = municipio.nome;

                await matricula.save()
            }
        })
    }
    
}