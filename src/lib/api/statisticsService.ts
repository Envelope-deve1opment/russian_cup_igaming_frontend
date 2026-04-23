import {requestJSON} from "$lib/api/baseAPI";
import type {LobbyItemDto} from "$lib/api/dto";

export interface FinancialStatistics {
    houseCommissionAmountTotal: number,
    totalCollectedAmountTotal: number,
    payoutAmountTotal: number,
    houseProfit: number
}

export const statisticsService = {
    async getStatistics(): Promise<FinancialStatistics> {
        return await requestJSON<FinancialStatistics>("/admin/financialRoundResults/statistics");
    }
};
