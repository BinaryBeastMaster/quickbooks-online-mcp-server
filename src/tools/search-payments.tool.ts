import { searchQuickbooksPayments } from "../handlers/search-quickbooks-payments.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "search_payments";
const toolDescription = "Search payments (customer receive payments) in QuickBooks Online using criteria (maps to node-quickbooks findPayments).";

const ALLOWED_FILTER_FIELDS = [
    "Id",
    "MetaData.CreateTime",
    "MetaData.LastUpdatedTime",
    "TxnDate",
    "TotalAmt",
    "CustomerRef",
    "PaymentMethodRef",
    "PaymentRefNum",
] as const;

const ALLOWED_SORT_FIELDS = [
    "Id",
    "MetaData.CreateTime",
    "MetaData.LastUpdatedTime",
    "TxnDate",
    "TotalAmt",
] as const;

const FIELD_TYPE_MAP = {
    "Id": "string",
    "MetaData.CreateTime": "date",
    "MetaData.LastUpdatedTime": "date",
    "TxnDate": "date",
    "TotalAmt": "number",
    "CustomerRef": "string",
    "PaymentMethodRef": "string",
    "PaymentRefNum": "string",
} as const;

const isValidValueType = (field: string, value: any): boolean => {
    const expectedType = FIELD_TYPE_MAP[field as keyof typeof FIELD_TYPE_MAP];
    return typeof value === expectedType;
};

const filterableFieldSchema = z
    .string()
    .refine((val) => (ALLOWED_FILTER_FIELDS as readonly string[]).includes(val), {
        message: `Field must be one of: ${ALLOWED_FILTER_FIELDS.join(", ")}`,
    });

const sortableFieldSchema = z
    .string()
    .refine((val) => (ALLOWED_SORT_FIELDS as readonly string[]).includes(val), {
        message: `Sort field must be one of: ${ALLOWED_SORT_FIELDS.join(", ")}`,
    });

const operatorSchema = z.enum(["=", "IN", "<", ">", "<=", ">=", "LIKE"]).optional();
const filterSchema = z.object({
    field: filterableFieldSchema,
    value: z.any(),
    operator: operatorSchema,
}).superRefine((obj, ctx) => {
    if (!isValidValueType(obj.field as string, obj.value)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Value type does not match expected type for field ${obj.field}`,
        });
    }
});

const advancedCriteriaSchema = z.object({
    filters: z.array(filterSchema).optional(),
    asc: sortableFieldSchema.optional(),
    desc: sortableFieldSchema.optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
    count: z.boolean().optional(),
    fetchAll: z.boolean().optional(),
});

const RUNTIME_CRITERIA_SCHEMA = z.union([
    z.record(z.any()),
    z.array(z.record(z.any())),
    advancedCriteriaSchema,
]);

const toolSchema = z.object({ criteria: z.any() });

const toolHandler = async ({ params }: any) => {
    const { criteria } = params;

    const parsed = RUNTIME_CRITERIA_SCHEMA.safeParse(criteria);
    if (!parsed.success) {
        return {
            content: [
                { type: "text" as const, text: `Invalid criteria: ${parsed.error.message}` },
            ],
        };
    }

    const response = await searchQuickbooksPayments(criteria);

    if (response.isError) {
        return {
            content: [
                { type: "text" as const, text: `Error searching payments: ${response.error}` },
            ],
        };
    }
    const payments = response.result;
    return {
        content: [
            { type: "text" as const, text: `Found ${payments?.length || 0} payments` },
            ...(payments?.map((p) => ({ type: "text" as const, text: JSON.stringify(p) })) || []),
        ],
    };
};

export const SearchPaymentsTool: ToolDefinition<typeof toolSchema> = {
    name: toolName,
    description: toolDescription,
    schema: toolSchema,
    handler: toolHandler,
};
