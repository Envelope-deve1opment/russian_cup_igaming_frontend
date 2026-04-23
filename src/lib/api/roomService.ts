import {requestJSON} from "$lib/api/baseAPI";
import type {BoostStateDto, RoomDetailsDto, RoomDto, RoomListItemDto} from "$lib/api/dto";

export const roomService = {
    async getActiveRooms(): Promise<RoomListItemDto[]> {
        return await requestJSON<RoomListItemDto[]>("/room/active");
    },
    async getDetails(roomId: string): Promise<RoomDetailsDto> {
        const roomDetail: RoomDetailsDto = await requestJSON<RoomDetailsDto>(`/room/${roomId}`)
        const countdownSeconds: number = new Date(roomDetail.roundStartedAt).getTime() - new Date(roomDetail.createdAt).getTime()

        return {
            ...roomDetail,
            countdownSeconds: countdownSeconds / 1000,
            timerEndsAt: new Date(roomDetail.roundStartedAt).getTime()
        }
    },
    async manualJoin(templateId: string): Promise<RoomDto> {
        return await requestJSON<RoomDto>(`/room/manual?templateId=${encodeURIComponent(templateId)}`, {method: "POST"});
    },
    async fastJoin(templateId: string): Promise<RoomDto> {
        return await requestJSON<RoomDto>(`/room/fastJoin?templateId=${encodeURIComponent(templateId)}`, {method: "POST"});
    },
    async buyBoost(roomId: string): Promise<BoostStateDto> {
        return await requestJSON<BoostStateDto>(`/room/${roomId}/boost`, {method: "POST"});
    },
};
