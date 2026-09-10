import { z } from "zod";

export const agentToolSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  enabled: z.boolean().default(true),
});

export const agentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  description: z.string().default(""),
  systemPrompt: z.string().min(10),
  goals: z.array(z.string()).default([]),
  tools: z.array(agentToolSchema).default([]),
  model: z.string().default("default"),
  temperature: z.number().min(0).max(2).default(0.4),
  maxSteps: z.number().int().min(1).max(50).default(8),
  status: z.enum(["draft", "testing", "deployed"]).default("draft"),
  version: z.number().int().min(1).default(1),
});

export type AgentDefinition = z.infer<typeof agentSchema>;
export type AgentTool = z.infer<typeof agentToolSchema>;
