//import LastRequest from "providers/AxiosProvider/LastRequest"; //Por algum motivo o vscode começa a bugar todo se eu dou import dessa classe

declare module '@ioc:Axios/Iffar'{
    import { AxiosInstance } from "axios";

    const AxiosIffar: AxiosInstance;

    export default AxiosIffar;
}

declare module '@ioc:Axios/Nominatim'{
    import { AxiosInstance } from "axios";

    const AxiosNominatim: AxiosInstance;

    export default AxiosNominatim;
}

declare module '@ioc:Axios/Ibge'{
    import { AxiosInstance } from "axios";

    const AxiosIbge: AxiosInstance;

    export default AxiosIbge;
}

declare module '@ioc:LastRequest/Iffar'{
    const LastRequestIffar: LastRequest;
    export default LastRequestIffar;
}

declare module '@ioc:LastRequest/Nominatim'{
    const LastRequestNominatim: LastRequest;
    export default LastRequestNominatim;
}

declare module '@ioc:LastRequest/Ibge'{
    const lastRequestIbge: LastRequest;
    export default lastRequestIbge;
}