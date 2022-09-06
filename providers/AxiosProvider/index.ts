import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import axios from "axios";
import LastRequest from './LastRequest';
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
      lastRequestIffar.setInterval(100);

      return lastRequestIffar;
    })

    //Crio uma instância de axios específica para cada API que for utilizar, para respeitar suas dinstintas regras de uso (por exemplo, a Nominatim permite apenas 1 requisição por segundo, já a dos dados abertos do IFFar e também do IBGE possuem limites diferentes, onde não encontrei documentado)
    //Se der problema no gerenciamento de requisição, utilizar pacote: https://www.npmjs.com/package/axios-rate-limit
    //Usar o pacote agentkeepalive para gerenciar melhor o keep-alive das requisições
    this.app.container.singleton('Axios/Iffar', () => {
      //Preciso configurar o keepAlive
      const axiosIffar = axios.create({
        baseURL: 'https://dados.iffarroupilha.edu.br/api/v1/'
      });

      //Crio um interceptor, para verificar o intervalo necessário entre uma requisição e outra para enviar
      //Baseado em: https://stackoverflow.com/questions/43482639/throttling-axios-requests
      axiosIffar.interceptors.request.use(request => {
        console.log('Tá no interceptor');
        
        //Atualizo o tempo de "última requisição" antes mesmo de aguardar o tempo de espera para enviar a requisição. Isso faz com que qualquer outra requisição que chegar no meio tempo entre o intervalo dessa requisição e o seu envio tenha que aguardar ainda esse intervalo também
        let actualWaitingTime = this.app.container.use('LastRequest/Iffar').requestWaitingInterval(); //Preciso armazenar o tempo de espera atual, já que abaixo irei atualizar o novo tempo de lastRequestTime, e ele representará o tempo futuro. Se não fizer isso, a requisição atual iria aguardar o seu próprio intervalo criado por ela (eu acho)
        let futureLastRequestTime = Date.now() + this.app.container.use('LastRequest/Iffar').requestWaitingInterval(); //Tempo atual + intervalo de espera = indica quando que será enviada a requisição atual (deverá ser usado apenas para as requisições seguintes que forem enviadas)
        this.app.container.use('LastRequest/Iffar').updateTime(futureLastRequestTime);
        
        //Aguardo o tempo de espera
        return new Promise((resolve) => { //Envelopo a request dentro de uma Promise
          setTimeout( //Aguardo o tempo de espera para enviar a requisição
            () => resolve(request),
            actualWaitingTime
          )
        });
      })

      //Crio outro interceptor, para verificar se o dado já existe no cache e se o dado em cache não é antigo demais também
      //Baseado em: https://stackoverflow.com/questions/62686283/axios-how-to-intercept-and-respond-to-axios-request
      axiosIffar.interceptors.request.use(request => {
        console.log('Tá em outro interceptor');
        
        return request
      })
      
      
      //Crio um terceiro interceptor, para armazenar o dado no cache após receber a resposta da requisição
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
}
