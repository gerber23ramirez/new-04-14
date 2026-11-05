import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { AgentDefinition } from "./agents/schema";
import type { AgentRunResult } from "./agents/runtime";

export type RunRecord = {
  id: string;
  agentId: string;
  version: number;
  message: string;
  result: AgentRunResult;
  createdAt: string;
};

export type AuditEntry = { at: string; action: string; agentId?: string; detail?: string };

type Data = {
  agents: Record<string, AgentDefinition[]>;
  runs: RunRecord[];
  audit: AuditEntry[];
};

const empty = (): Data => ({ agents: {}, runs: [], audit: [] });

// Simple file-backed JSON store. Swap for a database behind the same API.
export class FileStore {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private file: string) {}

  private async read(): Promise<Data> {
    try {
      return { ...empty(), ...JSON.parse(await fs.readFile(this.file, "utf8")) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return empty();
      throw error;
    }
  }

  private async write(data: Data) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(data, null, 2));
  }

  private mutate<T>(fn: (data: Data) => T): Promise<T> {
    const next = this.queue.then(async () => {
      const data = await this.read();
      const result = fn(data);
      await this.write(data);
      return result;
    });
    this.queue = next.catch(() => undefined);
    return next;
  }

  async saveAgent(agent: AgentDefinition): Promise<AgentDefinition> {
    return this.mutate((data) => {
      const versions = data.agents[agent.id] ?? [];
      const saved = { ...agent, version: versions.length + 1 };
      data.agents[agent.id] = [...versions, saved];
      data.audit.push({ at: new Date().toISOString(), action: "agent.save", agentId: agent.id, detail: `v${saved.version}` });
      return saved;
    });
  }

  async listAgents(): Promise<AgentDefinition[]> {
    const data = await this.read();
    return Object.values(data.agents).map((v) => v[v.length - 1]);
  }

  async getVersions(id: string): Promise<AgentDefinition[]> {
    return (await this.read()).agents[id] ?? [];
  }

  async getAgent(id: string, version?: number): Promise<AgentDefinition | undefined> {
    const versions = await this.getVersions(id);
    return version ? versions.find((a) => a.version === version) : versions[versions.length - 1];
  }

  async recordRun(agent: AgentDefinition, message: string, result: AgentRunResult): Promise<RunRecord> {
    return this.mutate((data) => {
      const run: RunRecord = {
        id: randomUUID(),
        agentId: agent.id,
        version: agent.version,
        message,
        result,
        createdAt: new Date().toISOString(),
      };
      data.runs.push(run);
      data.audit.push({ at: run.createdAt, action: "agent.run", agentId: agent.id, detail: result.status });
      return run;
    });
  }

  async listRuns(agentId?: string): Promise<RunRecord[]> {
    const runs = (await this.read()).runs;
    return agentId ? runs.filter((r) => r.agentId === agentId) : runs;
  }

  async listAudit(): Promise<AuditEntry[]> {
    return (await this.read()).audit;
  }
}

let store: FileStore | undefined;

export function getStore() {
  store ??= new FileStore(process.env.AGENTFORGE_DATA_FILE ?? path.join(process.cwd(), ".data", "store.json"));
  return store;
}
