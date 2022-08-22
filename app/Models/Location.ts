import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Location extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column() // O id da localidade fornecido pela API do IFFar
  public apiId: number

  @column() // O nome da localidade forncecido pela API do IFFar
  public name: string

  @column() // Se a localidade é uma cidade ou estado
  public locationType: string

  @column() // O JSON da requisição transformado em string
  public request: string

  @column.dateTime()
  public requestTime: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
