import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

/**
 * IMPORTANTE: Os nomes dos atributos do modelo foram baseados nos microdados de matriculas do ano base de 2020, normalizando os nomes, para substituição de caracteres especiais e a utilização de string.camelCase(), para o modelo, e string.snakeCase(), para o migration.
 * let propertyNormalized = property.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
 * let text = `@column()\npublic ${string.camelCase(propertyNormalized)}: string;\n`;
 * let text = `table.string('${string.snakeCase(propertyNormalized)}')`;
 * 
 * Fonte do código para normalização: https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
 */

export default class PnpMatricula extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  //Atributos que eu adicionei para controle
  @column()
  public anoBase: string;
  @column()
  public nomeMunicipio: string; //Precisei adicionar esse atributo por causa que o PNP do ano base de 2020 não traz o nome dos municípios, apenas os seus códigos com dígito verificadores do IBGE

  //Atributos do PNP
  @column()
  public cargaHoraria: string;

  @column()
  public cargaHorariaMinima: string;

  @column()
  public categoriaDeSituacao: string;

  @column()
  public codUnidade: string;

  @column()
  public corRaca: string;

  @column()
  public codigoDaMatricula: string;

  @column()
  public codigoDaUnidadeDeEnsinoSistec: string;

  @column()
  public codigoDoCicloDeMatricula: string;

  @column()
  public codigoDoMunicipioComDv: string;

  @column()
  public dataDeFimPrevistoDoCiclo: string;

  @column()
  public dataDeInicioDoCiclo: string;

  @column()
  public dataDeOcorrenciaDaMatricula: string;

  @column()
  public eixoTecnologico: string;

  @column()
  public faixaEtaria: string;

  @column()
  public fatorEsforcoCurso: string;

  @column()
  public fonteDeFinanciamento: string;

  @column()
  public idade: string;

  @column()
  public instituicao: string;

  // @column()
  // public matricula_2019: string;

  @column()
  public modalidadeDeEnsino: string;

  @column()
  public mesDeOcorrenciaDaSituacao: string;

  @column()
  public nomeDeCurso: string;

  @column()
  public numeroDeRegistros: string;

  @column()
  public regiao: string;

  @column()
  public rendaFamiliar: string;

  @column()
  public sexo: string;

  @column()
  public situacaoDeMatricula: string;

  @column()
  public subeixoTecnologico: string;

  @column()
  public tipoDeCurso: string;

  @column()
  public tipoDeOferta: string;

  @column()
  public tipoDeUnidade: string;

  @column()
  public tipoOferta: string;

  @column()
  public turno: string;

  @column()
  public uf: string;

  @column()
  public unidadeDeEnsino: string;

  @column()
  public vagasExtraordinariasAc: string;

  @column()
  public vagasExtraordinariasL1: string;

  @column()
  public vagasExtraordinariasL10: string;

  @column()
  public vagasExtraordinariasL13: string;

  @column()
  public vagasExtraordinariasL14: string;

  @column()
  public vagasExtraordinariasL2: string;

  @column()
  public vagasExtraordinariasL5: string;

  @column()
  public vagasExtraordinariasL6: string;

  @column()
  public vagasExtraordinariasL9: string;

  @column()
  public vagasOfertadas: string;

  @column()
  public vagasRegularesAc: string;

  @column()
  public vagasRegularesL1: string;

  @column()
  public vagasRegularesL10: string;

  @column()
  public vagasRegularesL13: string;

  @column()
  public vagasRegularesL14: string;

  @column()
  public vagasRegularesL2: string;

  @column()
  public vagasRegularesL5: string;

  @column()
  public vagasRegularesL6: string;

  @column()
  public vagasRegularesL9: string;
}
