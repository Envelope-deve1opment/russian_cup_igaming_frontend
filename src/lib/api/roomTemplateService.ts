import {ServiceBaseWithGetAll} from "$lib/api/JSONServiceBase";

const RoomTemplatesBaseAPI: string = "/api/technical/users" as const;

export interface RoomTemplateDTO {
    id: string
    templateName: string
    entryFee: number
    participantsCount: number
    active: boolean
    boostEnabled: boolean
    boostCost: number
    countdownSeconds: number
    createdAt: string
    updatedAt: string
}


class RoomTemplateService extends ServiceBaseWithGetAll<RoomTemplateDTO> {
    constructor() {
        super(RoomTemplatesBaseAPI);
    }

}

export const roomTemplateService = new RoomTemplateService();
