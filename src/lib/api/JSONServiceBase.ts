import {ClientAPI} from "$lib/api/baseAPI";

// Мета-класс сервиса для классической архитектуры REST
export class JSONServiceBase<T> {
    public serviceAPIURLBase: string

    constructor(serviceAPIURLBase: string) {
        this.serviceAPIURLBase = serviceAPIURLBase;
    }

    async get(entityID: string): Promise<T> {
        return await ClientAPI.get<"JSON", T>(
            `${this.serviceAPIURLBase}/${entityID}`,
            {
                callbacks: {
                    onSuccess: (entity: T): T => entity
                },
                convertType: "JSON"
            }
        );
    }

    async put(entityID: string, edits: Partial<T>): Promise<T> {
        return await ClientAPI.put<"JSON", T>(
            `${this.serviceAPIURLBase}`,
            {
                "id": entityID,
                ...edits,
            },
            {
                callbacks: {
                    onSuccess: (user: T): T => user
                },
                convertType: "JSON"
            }
        );
    }

    async post(fields: Partial<T>): Promise<T> {
        return await ClientAPI.post<"JSON", T>(
            `${this.serviceAPIURLBase}`,
            fields,
            {
                callbacks: {
                    onSuccess: (entity: T): T => entity
                },
                convertType: "JSON"
            }
        );
    }

    async delete(entityID: string): Promise<void> {
        await ClientAPI.delete(
            `${this.serviceAPIURLBase}/${entityID}`,
            {
                convertType: "JSON"
            }
        );
    }
}

export class ServiceBaseWithGetAll<T> extends JSONServiceBase<T> {
    async getAll(): Promise<T[]> {
        console.log(ClientAPI.client.options)
        return await ClientAPI.get<"JSON", T[]>(
            `${this.serviceAPIURLBase}`,
            {
                callbacks: {
                    onSuccess: (entities: T[]): T[] => entities
                },
                convertType: "JSON"
            }
        );
    }
}
