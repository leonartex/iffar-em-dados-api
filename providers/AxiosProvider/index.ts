import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import Agent from 'agentkeepalive';
import LastRequest from './LastRequest';

import util from 'util';
/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
|
| Your application is not ready when this file is loaded by the framework.
| Hence, the top level imports relying on the IoC container will not work.
| You must import them inside the life-cycle methods defined inside
| the provider class.
|
| @example:
|
| public async ready () {
|   const Database = this.app.container.resolveBinding('Adonis/Lucid/Database')
|   const Event = this.app.container.resolveBinding('Adonis/Core/Event')
|   Event.on('db:query', Database.prettyPrint)
| }
|
*/
export default class Index {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings

    //Crio um singleton para se ter um dado "global" contendo o tempo do último request enviado para determinada API, neste caso, para a API do IFFar. Por ser singleton, cria-se uma única instância, permitindo acessar o mesmo dado em diferentes lugares
    this.app.container.singleton('LastRequest/Iffar', () => {
      let lastRequestIffar = new LastRequest();
      lastRequestIffar.setInterval(50); //Defino o intervalo para a API dos dados abertos do IFFar

      return lastRequestIffar;
    })

    //Configuração de um HttpAgent que lida melhor com as conexões HTTP com KeepAlive. Será utilizado em todos as instâncias de Axios exportadas daqui
    const httpKeepAliveAgent = new Agent({
      maxSockets: 100,
      maxFreeSockets: 10,
      timeout: 60000, // active socket keepalive for 60 seconds
      freeSocketTimeout: 30000, // free socket keepalive for 30 seconds
    });

    //Crio uma instância de axios específica para cada API que for utilizar, para respeitar suas dinstintas regras de uso (por exemplo, a Nominatim permite apenas 1 requisição por segundo, já a dos dados abertos do IFFar e também do IBGE possuem limites diferentes, onde não encontrei documentado)
    //Se der problema no gerenciamento de requisição, utilizar pacote: https://www.npmjs.com/package/axios-rate-limit
    //Usar o pacote agentkeepalive para gerenciar melhor o keep-alive das requisições
    this.app.container.singleton('Axios/Iffar', () => {
      //Preciso configurar o keepAlive
      const axiosIffar = axios.create({
        baseURL: 'https://dados.iffarroupilha.edu.br/api/v1/',
        httpAgent: httpKeepAliveAgent,
      });

      
      //Crio um interceptor, para, primeiro, verificar a existência de cache, e, segundo, verificar o intervalo necessário entre uma requisição e outra para o envio
      //Controle de intervalo entre requisições baseado em: https://stackoverflow.com/questions/43482639/throttling-axios-requests
      //Controle do envio de cache baseado em: https://github.com/axios/axios/issues/1666#issuecomment-607625254
      //Existe uma outra alternativa meio gambiarra: https://stackoverflow.com/questions/62686283/axios-how-to-intercept-and-respond-to-axios-request
      //O objetivo era que fossem criados dois interceptors distintos: um para controlar o timing das requisições e outro, que executasse antes, para verificar a existência do cache, retornando a resposta com os dados antes mesmo de enviar a requisição, contudo, não foi possível implementar isso, conforme a estratégia de envio de cache utilizada (o envio da resposta com o cache não impedia a passagem pelo outro interceptor)
      axiosIffar.interceptors.request.use(async config => {
        let healthReport = await this.app.container.use('Adonis/Core/HealthCheck').getReport();
        let redisHealth = healthReport.report.redis.health; //Pego os dados específicos sobre a saúde da conexão com o Redis
        if (redisHealth.healthy) { //Checo se está saudável a conexão
          console.log('Conexão Redis ok')
          //Verifico se existe os dados requisitados no cache
          let keyName = this.redisKeyNameIffarApi(config);
          let cache = await this.app.container.use('Adonis/Addons/Redis').get(keyName)
          if(cache){
            //Existindo cache, retorno então uma resposta já previamente formulada contendo os dados do cache. Dessa forma a requisição não é nem enviada para a API externa, retornando o dado necessário
            config.adapter = function (config) {
              return new Promise((resolve, reject) => {
                const res = {
                  data: cache,
                  status: 200,
                  statusText: "OK",
                  headers: { "content-type": "text/plain; charset=utf-8" },
                  config,
                  request: {},
                  isCache: true //Adiciono esse atributo para indicar ser cache, assim, pulando a o registro desnecessário da resposta no Redis no interceptor de respostas
                };
        
                return resolve(res);
              });
        
            }
          }
          return config //Envio o AxiosRequestConfig com os dados do cache
        }

        //Se não retornou a config da request até aqui, segue para o processo de envio da requisição, realizando o controle de tempo entre uma requisição e outra

        //Atualizo o tempo de "última requisição" antes mesmo de aguardar o tempo de espera para enviar a requisição. Isso faz com que qualquer outra requisição que chegar no meio tempo entre o intervalo dessa requisição e o seu envio tenha que aguardar ainda esse intervalo também
        let actualWaitingTime = this.app.container.use('LastRequest/Iffar').requestWaitingInterval(); //Preciso armazenar o tempo de espera atual, já que abaixo irei atualizar o novo tempo de lastRequestTime, e ele representará o tempo futuro. Se não fizer isso, a requisição atual iria aguardar o seu próprio intervalo criado por ela (eu acho)
        let futureLastRequestTime = Date.now() + this.app.container.use('LastRequest/Iffar').requestWaitingInterval(); //Tempo atual + intervalo de espera = indica quando que será enviada a requisição atual (deverá ser usado apenas para as requisições seguintes que forem enviadas)
        this.app.container.use('LastRequest/Iffar').updateTime(futureLastRequestTime);
        
        //Aguardo o tempo de espera
        return new Promise((resolve) => { //Envelopo a request dentro de uma Promise
          setTimeout( //Aguardo o tempo de espera para enviar a requisição
            () => resolve(config),
            actualWaitingTime
          )
        });
      })
      
      //Crio outro interceptor, para armazenar o dado no cache após receber a resposta das requisições
      axiosIffar.interceptors.response.use(async response => {
        //Verifico na resposta de é cache, se for, retorno ela imediatamente, para pular todo o processo de armazenamento no cache
        if(response.isCache)
          return response

        //Checa-se a saúde da conexão com o Redis antes de tentar armazenar o cache da requisição. Isso é importante por causa que o cache não pode ser algo bloqueante, então, se não der pra armazenar o cache, deve retornar a resposta o mais rápido possível para não prejudicar o usuário
        let healthReport = await this.app.container.use('Adonis/Core/HealthCheck').getReport();
        let redisHealth = healthReport.report.redis.health; //Pego os dados específicos sobre a saúde da conexão com o Redis
        if (redisHealth.healthy) { //Checo se está saudável a conexão
          let keyName = this.redisKeyNameIffarApi(response);
          this.app.container.use('Adonis/Addons/Redis').set(keyName, JSON.stringify(response.data), ) //Adiciono no Redis o cache da requisição
            .then(() => { 
              //Adiciono um tempo para expirar o cache
              let baseTime = 24 * 60 * 60 //Tempo base de 4 horas. É um longo tempo, mas os dados abertos do IFFar possuem níveis extremamente baixos de atualização. Um atraso de 4-5 horas para atualizar seus valores não seria algo prejudicial, ao mesmo tempo que tornaria mais eficiente a entrega dos dados para o front-end
              let randomAddTime = Math.floor(Math.random() * ((60*60) - (1) + 1) + (1))//Adiciono um número aletório de segundos em um intervalo de 1 segundo a 1 hora. Serve para diminuir as chances de que precise enviar todas as requisições de uma página ao mesmo tempo para montar a página, prejudincando esse usuário com um maior tempo de espera
              this.app.container.use('Adonis/Addons/Redis').expire(keyName, baseTime+randomAddTime)
                .then(() => {return response})
                .catch(() => {return response})
            })
            .catch(() => {return response}) //Se não conseguir armazenar no Redis por causa de algum problema, retorna a response (o cache serve para auxiliar, não para ser a base da aplicação)
        }

        return response; //Se não conseguir salvar no Redis por causa de problema de conexão com o Redis, ainda envia a resposta da requisição
      })

      // axios.interceptors.response.use(function (response) {
      //   // Qualquer código de status que dentro do limite de 2xx faz com que está função seja acionada
      //   // Faz alguma coisa com os dados de resposta
      //   return response;
      // }, function (error) {
      //   // Qualquer código de status que não esteja no limite do código 2xx faz com que está função seja acionada
      //   // Faz alguma coisa com o erro da resposta
      //   return Promise.reject(error);
      // });

      return axiosIffar;
    })
  }

  public async boot() {
    // All bindings are ready, feel free to use them
  }

  public async ready() {
    // App is ready
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }

  private redisKeyNameIffarApi(reqRes: AxiosRequestConfig | AxiosResponse | any){
    //Verifico se o reqRes é uma request ou uma response, para utilizar o atributo correto contendo o dado da url
    let url: string;
    if(reqRes.url != undefined) //É uma request
      url = reqRes.url;
    else //É uma response
      url = reqRes.config.url;

    let apiName = 'iffar'; //Nome da API utilizada (será usada como parte do nome da chave do registro no Redis)
        
    const databaseRegExp = /.*(?=\.json)/ //Expressão regular para filtrar o nome da base buscada    
    let databaseName: any = url.match(databaseRegExp);
    //console.log(databaseName)
    
    const paramsRegExp = /(?:\.json\?)(.*)/ //Expressão regular para filtrar os parametros da requisição (a string com os parâmetros estarão no segundo grupo do match, utilizando o índice 1 no array)
    let params: any = url.match(paramsRegExp);
    //console.log(params);

    let keyName = `${apiName}:${databaseName[0]}:${params[1]}`; //O nome final da key que será utilizada no Redis
    //console.log('KeyName: '+keyName);
    return keyName;
  }
}
