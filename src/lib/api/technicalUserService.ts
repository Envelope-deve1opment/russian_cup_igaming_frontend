import {requestJSON} from "$lib/api/baseAPI";
import type {TechnicalUserDto} from "$lib/api/dto";

export const technicalUserService = {
    async getAll(): Promise<TechnicalUserDto[]> {
        return await requestJSON<TechnicalUserDto[]>("/technical/users");
    }
};
