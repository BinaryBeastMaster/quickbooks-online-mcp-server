import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { buildQuickbooksSearchCriteria, QuickbooksSearchCriteriaInput } from "../helpers/build-quickbooks-search-criteria.js";

export type PaymentSearchCriteria = QuickbooksSearchCriteriaInput;

/**
 * Search for payments (Receive Payments) in QuickBooks Online using criteria supported by node-quickbooks findPayments.
 */
export async function searchQuickbooksPayments(criteria: PaymentSearchCriteria): Promise<ToolResponse<any[]>> {
    try {
        await quickbooksClient.authenticate();
        const quickbooks = quickbooksClient.getQuickbooks();
        const normalizedCriteria = buildQuickbooksSearchCriteria(criteria);

        return new Promise((resolve) => {
            quickbooks.findPayments(normalizedCriteria, (err: any, response: any) => {
                if (err) {
                    resolve({ result: null, isError: true, error: formatError(err) });
                } else {
                    resolve({
                        result: response.QueryResponse?.Payment || [],
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
