import LastRequest from "providers/AxiosProvider/LastRequest";

declare module '@ioc:Axios/Iffar'{
    import { AxiosInstance } from "axios";

    const AxiosIffar: AxiosInstance;

    export default AxiosIffar;
}

declare module '@ioc:LastRequest/Iffar'{
    const LastRequestIffar: LastRequest;
    export default LastRequestIffar;
}