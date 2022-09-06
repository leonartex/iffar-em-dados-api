//import LastRequest from "providers/AxiosProvider/LastRequest"; //Por algum motivo o vscode começa a bugar todo se eu dou import dessa classe

declare module '@ioc:Axios/Iffar'{
    import { AxiosInstance } from "axios";

    const AxiosIffar: AxiosInstance;

    export default AxiosIffar;
}

declare module '@ioc:LastRequest/Iffar'{
    const LastRequestIffar: LastRequest;
    export default LastRequestIffar;
}