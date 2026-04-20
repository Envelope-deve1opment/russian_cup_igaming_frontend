import {BestFetch} from "bestfetch-g";

const curAPIBase: string = "http://localhost:8080/api";

// Используем свою библиотеку запросов со строгой типизацией (она open-source, есть на npm и github)
// По необходимости можно заменить на свой класс
export const ClientAPI: BestFetch = new BestFetch({
    baseURL: curAPIBase,
})
