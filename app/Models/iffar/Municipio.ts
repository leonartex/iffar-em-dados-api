// import { DateTime } from 'luxon'
// import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import UnidadesFederativa from './UnidadeFederativa';

export default class Municipio {
  public id_municipio: number;

  public nome: string;

  public id_unidade_federativa: number;
  
  //Atributo adicional para adicionar o objeto do estado
  public state: UnidadesFederativa;
}
