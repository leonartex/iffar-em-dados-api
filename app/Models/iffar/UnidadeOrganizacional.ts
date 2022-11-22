/*
  Classe representando o objeto retornado pela requisição da base "unidades-organizacionais" da API de dados abertos do IFFar

  // unidade_responsavel=672     INSTITUTO FEDERAL FARROUPILHA
*/

import Municipio from "./Municipio";

//import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class UnidadeOrganizacional {
  //@column()
  public id_unidade: number;

  //@column()
  public nome: string;

  //@column()
  public sigla: string;

  //@column()
  public unidade_responsavel: number;

  //@column()
  public id_municipio: number;

  //@column()
  public ativo: number;

  //Atributos adicionais, para poder indicar o tipo de unidade (campus, campus avançado, etc.) e adicionar os dados da cidade no mesmo elemento
  public type: string;
  public city: Municipio;
  public location?: any;
}
