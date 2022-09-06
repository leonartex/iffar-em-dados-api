export default class LastRequest{
    public lastRequestTime: number = Date.now();
    public interval: number; //O intervalo de requisições necessários para determinada API, em milissegundos
    public updateTime(time: number = Date.now()){
        this.lastRequestTime = time;
    }

    public setInterval(ms: number){
        this.interval = ms;
    }

    //Crio uma função para retornar o tempo de espera que é necessário para enviar a requisição
    public requestWaitingInterval(): number{
        //Defino o tempo de espera necessário para a próxima requisição ao pegar o período da última requisição e somar com o intervalo, subtraindo, no final, com o período atual
        // //Contudo, considerando que o tempo de lastRequestTime pode representar o futuro (no provider eu atualizo o lastRequestTime antes de enviar a requisição, para evitar que sejam enviadas outras requisições enquanto ela espera), preciso também adicionar a possível diferença de tempo entre o agora, Date.now(), e o tempo de lastRequestTime, se representar o futuro
        // let futureRequestTimeDiff: number = 0;
        // if(this.lastRequestTime > Date.now()) //Se o lastRequestTime representar algo no futuro, pego a diferença de tempo entre o atributo e o agora para adicionar na espera
        //     futureRequestTimeDiff = this.lastRequestTime - Date.now();

        //Tempo de espera = (Período da última requisição + intervalo) - O agora
        let waitingTime = (this.lastRequestTime + this.interval) - Date.now();

        //Se retornar um valor negativo, ou seja, se o período atual é maior do que o período da última requisição somado ao intervalo necessário, retorna 0 (será realizada uma espera de 0ms)
        if(waitingTime < 0)
            return 0;

        return waitingTime;
    }
}