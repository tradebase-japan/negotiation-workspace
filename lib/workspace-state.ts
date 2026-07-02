import { z } from "zod";
import {
  candidatesSchema,
  manufacturersDataSchema,
  regionsSchema,
} from "@/lib/schema";

export const workspaceStateSchema = z.object({
  deals: candidatesSchema,
  manufacturers: manufacturersDataSchema,
  regions: regionsSchema,
  selectedManufacturerId: z.string(),
  selectedDealId: z.string(),
  updatedAt: z.string().optional(),
});

export type WorkspaceState = z.infer<typeof workspaceStateSchema>;

export const workspaceStatePayloadSchema = workspaceStateSchema.omit({
  updatedAt: true,
});

export type WorkspaceStatePayload = z.infer<typeof workspaceStatePayloadSchema>;
