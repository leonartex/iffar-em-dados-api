// import { DateTime } from 'luxon'
// import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

import Location from "./Location"

export default class Unit {
  //O id da unidade utilizado na API de dados abertos do IFFar
  public apiId: number
  
  //O nome da unidade utilizado na API de dados abertos do IFFar. Não possui muito uso além de visualizar melhor o  controle do dado.
  public name: string

  //Se é: Campus; Campus avançado; Centro de referência; ou Polo EaD
  public type: string

  public city: {
    //O id da cidade utilizado na API de dados abertos do IFFar. O id da cidade vai ser usado para relacionas as diferentes unidades em uma mesma cidade (ex.: Onde existe campus e também polo EaD, para interagir como uma única coisa)
    cityId: number,
    //O nome da cidade utilizado na API de dados abertos do IFFar. Esse sim é utilizado para identificação da unidade (ex.: type + cityName = Campus São Borja)
    cityName: string,
  }

  public state: {
    //O id da unidade federativa utilizado na API de dados abertos do IFFar.
    stateId: number,
    stateName: string,
    stateInitials: string
  }
  
  //Os dados geográficos da cidade da unidade, necessários para a utilização de gráfico
  public location: {
    coordinates: Object,
    geojson: Object
  }
}
