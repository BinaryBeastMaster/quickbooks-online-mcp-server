import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { buildQuickbooksSearchCriteria, QuickbooksSearchCriteriaInput } from "../helpers/build-quickbooks-search-criteria.js";

export type DepositSearchCriteria = QuickbooksSearchCriteriaInput;

/**
 * Search for deposits in QuickBooks Online using criteria supported by node-quickbooks findDeposits.
 */
export async function searchQuickbooksDeposits(criteria: DepositSearchCriteria): Promise<ToolResponse<any[]>> {
    try {
        await quickbooksClient.authenticate();
        const quickbooks = quickbooksClient.getQuickbooks();
        const normalizedCriteria = buildQuickbooksSearchCriteria(criteria);

        return new Promise((resolve) => {
            quickbooks.findDeposits(normalizedCriteria, (err: any, response: any) => {
                if (err) {
                    resolve({ result: null, isError: true, error: formatError(err) });
                } else {
                    resolve({
                        result: response.QueryResponse?.Deposit || [],
                        isError: false,
                        error: null,
                    });
                }
            });
        });
    } catch (error) {
        return { result: null, isError: true, error: formatError(error) };
    }
}
