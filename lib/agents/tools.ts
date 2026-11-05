export type ToolHandler = (input: Record<string, unknown>) => Promise<string> | string;

export class ToolRegistry {
  private handlers = new Map<string, ToolHandler>();

  register(id: string, handler: ToolHandler) {
    this.handlers.set(id, handler);
    return this;
  }

  has(id: string) {
    return this.handlers.has(id);
  }

  async execute(id: string, input: Record<string, unknown>): Promise<string> {
    const handler = this.handlers.get(id);
    if (!handler) throw new Error(`Unknown tool: ${id}`);
    return handler(input);
  }
}

export function createDefaultRegistry() {
  return new ToolRegistry().register("echo", (input) => String(input.query ?? ""));
}
