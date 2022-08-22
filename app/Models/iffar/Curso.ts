// import { DateTime } from 'luxon'
// import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Curso {
  public id_curso: number;
  public id_unidade: number;
  public codigo: string;
  public nome: string;
  public nivel: string;
  public id_modalidade_educacao: number;
  public id_municipio: number;
  public id_tipo_oferta_curso: number;
  public id_area_curso: number;
  public id_grau_academico: number;
  public id_eixo_conhecimento: number;
  public ativo: number;
}
