/**
 * Cada objeto enviado da API para o front-end apresenta um atributo opcional chamado source, para indicar a fonte de onde foram extraídas as informações. 
 * Esse atributo será composto por um objeto 'espelho' do próprio elemento, indicando quais as fontes para determinado atributo, que é herdado para os atributos filhos apenas até haver uma outra definição de source para o atributo filho (objeto dentro de um objeto, como o campo location dentro de uma Unit).
 * Ex. de um Unit:
 * Unit: {
 *  apiId,
 *  name,
 *  type,
 *  ...,
 *  location,
 *  source: {
    *  apiId,
    *  name,
    *  type,
    *  ...,
    *  location: {
    *   coordinates,
    *   geojson,
    *   source: "Nominatim"
    *  },
    *  source: "API do IFFar em Dados"
 *  }
 * }
 */

/*
Selecionar lista de campi
Requisição: https://dados.iffarroupilha.edu.br/api/v1/unidades-organizacionais.html
    Filtrar por:
    Campus e Campus avançado
        ativo=1
        unidade_responsavel=672     INSTITUTO FEDERAL FARROUPILHA
        Iniciar com CAMPUS AVANÇADO
            Tipo: campus-avançado
        Iniciar com CAMPUS
            Tipo: campus
    https://dados.iffarroupilha.edu.br/api/v1/unidades-organizacionais.json?ativo=1&unidade_responsavel=672
    
    Centro de referência
        ativo=1
        unidade_responsavel=52      CHEFIA DE GABINETE DO(A) REITOR(A)
        Iniciar com CENTRO DE REFERÊNCIA
            Tipo: centro-referencia
    https://dados.iffarroupilha.edu.br/api/v1/unidades-organizacionais.json?ativo=1&unidade_responsavel=52
    
    Polo EaD
        ativo=1
        Iniciar com COORDENAÇÃO DE EDUCAÇÃO A DISTÂNCIA
    
    unidades: {
        id_unidade
        tipo
        cidade
            nome
            geojson
    }



*/

/**
 * PLATAFORMA NILO PAÇANHA (PNP)
 * Fonte: http://dadosabertos.mec.gov.br/pnp
 * 1) Adiciono o arquivo original com um padrão de nome: pnp-NOME DOS MICRODADOS-ANO BASE
    * Vai o ano base no nome do arquivo para evitar confusões. 
    * A edição do PNP de 2021 possui os dados do ano base de 2020, então, utilizando o ano base no arquivo evita confusão por indicar exatamente o ano que aqueles dados representam.
    * Ex.: pnp-matriculas-2020
    * Os microdados podem ser: matriculas; eficiencia; servidores; e financeiros. Mas, até o momento, será utilizado apenas o matriculas (planejando para situações futuras)
 * 
 * 2) Pego os dados (parse) e crio uma versão filtrada apenas para o IFFar, com um padrão de nome: pnp-iffar-NOME DOS MICRODADOS-ANO BASE
    * Vai reduzir o consumo de processamento (o arquivo bruto original é gigante)
 * 
 * 3) Adiciono esses dados no SQLite
 * 
 * 4) Relaciono os dados do PNP com os cursos da API do IFFar
    * Uso o nome do município do PNP para filtrar os cursos de um campus específico
    * Uso regex para associar o nome do curso no PNP com o nome do curso na API do IFFar
    * * Uso a categoria de curso (técnico, graduação (bacharelado, lecenciatura, etc.), etc.) para dar ainda mais segurança
 * 
 */