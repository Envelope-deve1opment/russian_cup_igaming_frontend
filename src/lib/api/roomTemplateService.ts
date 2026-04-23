import {requestJSON} from "$lib/api/baseAPI";
import type {RoomTemplateCreateDto, RoomTemplateDto} from "$lib/api/dto";

export const roomTemplateService = {
    async getAll(): Promise<RoomTemplateDto[]> {
        return await requestJSON<RoomTemplateDto[]>("/roomTemplate");
    },
    async getById(id: string): Promise<RoomTemplateDto> {
        return await requestJSON<RoomTemplateDto>(`/roomTemplate/${id}`);
    },
    async create(payload: RoomTemplateCreateDto): Promise<RoomTemplateDto> {
        return await requestJSON<RoomTemplateDto>("/roomTemplate", {
            method: "POST",
            body: payload
        });
    },
    async update(payload: RoomTemplateDto): Promise<RoomTemplateDto> {
        return await requestJSON<RoomTemplateDto>("/roomTemplate", {
            method: "PUT",
            body: payload
        });
    },
    async remove(id: string): Promise<void> {
        await requestJSON<void>(`/roomTemplate/${id}`, {
            method: "DELETE"
        });
    }
};
