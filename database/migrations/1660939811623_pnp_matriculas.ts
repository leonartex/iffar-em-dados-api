import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'pnp_matriculas'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.string('ano_base')
      table.string('nome_municipio')

      table.string('carga_horaria')
      table.string('carga_horaria_minima')
      table.string('categoria_de_situacao')
      table.string('cod_unidade')
      table.string('cor_raca')
      table.string('codigo_da_matricula')
      table.string('codigo_da_unidade_de_ensino_sistec')
      table.string('codigo_do_ciclo_de_matricula')
      table.string('codigo_do_municipio_com_dv')
      table.string('data_de_fim_previsto_do_ciclo')
      table.string('data_de_inicio_do_ciclo')
      table.string('data_de_ocorrencia_da_matricula')
      table.string('eixo_tecnologico')
      table.string('faixa_etaria')
      table.string('fator_esforco_curso')
      table.string('fonte_de_financiamento')
      table.string('idade')
      table.string('instituicao')
      //table.string('matricula_2019')
      table.string('modalidade_de_ensino')
      table.string('mes_de_ocorrencia_da_situacao')
      table.string('nome_de_curso')
      table.string('numero_de_registros')
      table.string('regiao')
      table.string('renda_familiar')
      table.string('sexo')
      table.string('situacao_de_matricula')
      table.string('subeixo_tecnologico')
      table.string('tipo_de_curso')
      table.string('tipo_de_oferta')
      table.string('tipo_de_unidade')
      table.string('tipo_oferta')
      table.string('turno')
      table.string('uf')
      table.string('unidade_de_ensino')
      table.string('vagas_extraordinarias_ac')
      table.string('vagas_extraordinarias_l1')
      table.string('vagas_extraordinarias_l10')
      table.string('vagas_extraordinarias_l13')
      table.string('vagas_extraordinarias_l14')
      table.string('vagas_extraordinarias_l2')
      table.string('vagas_extraordinarias_l5')
      table.string('vagas_extraordinarias_l6')
      table.string('vagas_extraordinarias_l9')
      table.string('vagas_ofertadas')
      table.string('vagas_regulares_ac')
      table.string('vagas_regulares_l1')
      table.string('vagas_regulares_l10')
      table.string('vagas_regulares_l13')
      table.string('vagas_regulares_l14')
      table.string('vagas_regulares_l2')
      table.string('vagas_regulares_l5')
      table.string('vagas_regulares_l6')
      table.string('vagas_regulares_l9')
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
