import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const versions = await store.getVersions(id);
  if (versions.length === 0) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  return NextResponse.json({ agent: versions[versions.length - 1], versions, runs: await store.listRuns(id) });
}
