export default class Aluno {
  public id_discente: number
  public nome: string
  public ano_ingresso: number
  public periodo_ingresso: number
  public nivel: string
  public id_forma_ingresso: number
  public id_curso: number
  //É necessário utilizar o offset para recuperar registros além do limite dos 10000 primeiros registros
  //offset: number
}
