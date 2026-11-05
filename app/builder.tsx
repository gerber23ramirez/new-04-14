"use client";

import { useState } from "react";

type Version = { version: number; name: string };
type RunResult = { reply: string; steps: string[]; status: string; error?: string };

const AVAILABLE_TOOLS = [{ id: "echo", name: "Echo", description: "Returns the query it receives." }];

const box = { padding: 8, width: "100%", boxSizing: "border-box", font: "inherit" } as const;
const label = { display: "block", marginTop: 16, fontWeight: 600 } as const;

export default function Builder() {
  const [id, setId] = useState("my-agent");
  const [name, setName] = useState("My Agent");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.");
  const [goals, setGoals] = useState("");
  const [tools, setTools] = useState<Record<string, boolean>>({});
  const [maxSteps, setMaxSteps] = useState(8);
  const [temperature, setTemperature] = useState(0.4);
  const [versions, setVersions] = useState<Version[]>([]);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const definition = () => ({
    id: id.trim(),
    name,
    systemPrompt,
    goals: goals.split("\n").map((g) => g.trim()).filter(Boolean),
    tools: AVAILABLE_TOOLS.map((t) => ({ ...t, enabled: !!tools[t.id] })).filter((t) => t.enabled),
    maxSteps,
    temperature,
  });

  async function call(url: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: body ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const data = await call("/api/agents", definition());
    if (!data) return;
    const detail = await call(`/api/agents/${encodeURIComponent(data.agent.id)}`);
    if (detail) setVersions(detail.versions);
  }

  async function test() {
    if (!message.trim()) return;
    const data = await call("/api/agents/run", { agent: definition(), message });
    if (data) setResult(data);
  }

  return (
    <section style={{ marginTop: 48, padding: 24, border: "1px solid #ddd", borderRadius: 12 }}>
      <h2>Agent Builder</h2>

      <label style={label}>Agent ID</label>
      <input style={box} value={id} onChange={(e) => setId(e.target.value)} />
      <label style={label}>Name</label>
      <input style={box} value={name} onChange={(e) => setName(e.target.value)} />
      <label style={label}>Instructions</label>
      <textarea style={box} rows={4} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
      <label style={label}>Goals (one per line)</label>
      <textarea style={box} rows={3} value={goals} onChange={(e) => setGoals(e.target.value)} />

      <label style={label}>Tools</label>
      {AVAILABLE_TOOLS.map((t) => (
        <label key={t.id} style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={!!tools[t.id]}
            onChange={(e) => setTools({ ...tools, [t.id]: e.target.checked })}
          />{" "}
          {t.name} <small>— {t.description}</small>
        </label>
      ))}

      <label style={label}>Guardrails: max steps ({maxSteps})</label>
      <input type="range" min={1} max={50} value={maxSteps} onChange={(e) => setMaxSteps(Number(e.target.value))} />
      <label style={label}>Temperature ({temperature})</label>
      <input
        type="range"
        min={0}
        max={2}
        step={0.1}
        value={temperature}
        onChange={(e) => setTemperature(Number(e.target.value))}
      />

      <div style={{ marginTop: 16 }}>
        <button onClick={save} disabled={busy}>Save new version</button>
        {versions.length > 0 && (
          <span style={{ marginLeft: 12 }}>
            Versions: {versions.map((v) => `v${v.version}`).join(", ")}
          </span>
        )}
      </div>

      <h3 style={{ marginTop: 32 }}>Test console</h3>
      <textarea
        style={box}
        rows={2}
        placeholder="Send a test message to the draft agent"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button style={{ marginTop: 8 }} onClick={test} disabled={busy || !message.trim()}>Run test</button>

      {error && <p role="alert" style={{ color: "#b00020" }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 16, padding: 12, background: "#f6f6f6", borderRadius: 8 }}>
          <p><strong>Status:</strong> {result.status}</p>
          {result.reply && <p><strong>Reply:</strong> {result.reply}</p>}
          {result.error && <p><strong>Error:</strong> {result.error}</p>}
          <p><strong>Steps:</strong> {result.steps.join(" → ")}</p>
        </div>
      )}
    </section>
  );
}
