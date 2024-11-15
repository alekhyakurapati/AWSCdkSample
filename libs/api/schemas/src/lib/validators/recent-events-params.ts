import { z } from 'zod';

const DEFAULT_HOURS = 1;
const HOURS_IN_A_WEEK = 168;
export const recentEventsParamsSchema = z.object({
    hours: z.coerce.number().positive().max(HOURS_IN_A_WEEK).optional().default(1),
    name: z
        .string()
        .regex(/^[a-zA-Z0-9_.\-@]+$/)
        .transform((name) => {
            const [eventSource, eventName] = name.split('@');
            return { eventSource, eventName };
        }),
});
