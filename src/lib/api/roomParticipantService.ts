import {requestJSON} from "$lib/api/baseAPI";
import type {RoomParticipantDto} from "$lib/api/dto";

export const roomParticipantService = {
    async byRoomId(roomId: string): Promise<RoomParticipantDto[]> {
        return await requestJSON<RoomParticipantDto[]>(`/roomParticipant/byRoomId?roomId=${encodeURIComponent(roomId)}`);
    },
    async occupySeat(roomId: string, seatNum: number): Promise<RoomParticipantDto> {
        return await requestJSON<RoomParticipantDto>(`/roomParticipant/rooms/${roomId}/seats/${seatNum}`, {method: "POST"});
    },
    async releaseSeat(roomId: string, seatNum: number): Promise<RoomParticipantDto> {
        return await requestJSON<RoomParticipantDto>(`/roomParticipant/rooms/${roomId}/seats/${seatNum}`, {method: "DELETE"});
    },
    async leaveRoom(roomId: string): Promise<RoomParticipantDto[]> {
        return await requestJSON<RoomParticipantDto[]>(`/roomParticipant/rooms/${roomId}/users/me`, {method: "DELETE"});
    }
};
