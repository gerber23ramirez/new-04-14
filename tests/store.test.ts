import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { agentSchema } from "@/lib/agents/schema";
import { FileStore } from "@/lib/store";

let dir: string | undefined;
afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
  dir = undefined;
});

async function makeStore() {
  dir = await mkdtemp(path.join(tmpdir(), "agentforge-"));
  return new FileStore(path.join(dir, "store.json"));
}

const agent = agentSchema.parse({ id: "a1", name: "Helper", systemPrompt: "You are a helpful assistant." });

describe("FileStore", () => {
  it("versions agents on each save", async () => {
    const store = await makeStore();
    await store.saveAgent(agent);
    const v2 = await store.saveAgent({ ...agent, name: "Helper 2" });
    expect(v2.version).toBe(2);
    expect(await store.getVersions("a1")).toHaveLength(2);
    expect((await store.getAgent("a1"))?.name).toBe("Helper 2");
    expect((await store.getAgent("a1", 1))?.name).toBe("Helper");
    expect(await store.listAgents()).toHaveLength(1);
  });

  it("records runs and audit entries, surviving concurrent writes", async () => {
    const store = await makeStore();
    const saved = await store.saveAgent(agent);
    const result = { reply: "r", steps: [], status: "completed" as const };
    await Promise.all([1, 2, 3, 4, 5].map((n) => store.recordRun(saved, `m${n}`, result)));
    expect(await store.listRuns("a1")).toHaveLength(5);
    expect((await store.listAudit()).length).toBe(6);
  });
});
