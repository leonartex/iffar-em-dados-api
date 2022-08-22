import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'locations'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Importante: O Adonisjs usa snake_case como padrão para criar os elementos no banco de dados, então no model utiliza-se camelCase, mas na migration tem que ir em snake_case
      table.integer('api_id')
      table.string('name')
      table.string('location_type')
      table.string('request')
      table.timestamp('request_time')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
