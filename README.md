# AgentForge

AgentForge is an AI agent-building platform for creating, configuring, testing, and deploying reusable AI agents without forcing users to wire together unnecessary external services.

## MVP goals

- Visual agent creation flow
- Agent identity, instructions, goals, tools, and guardrails
- Reusable agent templates
- Test console before deployment
- Versioned agent configurations
- Google API/SDK integration points
- Stripe billing integration points
- Provider-neutral AI runtime so models can be swapped later
- Clean separation between UI, orchestration, integrations, persistence, and billing

## Architecture

```text
app/                 Next.js routes and UI
components/          Reusable interface components
lib/agents/          Agent schemas, runtime, validation, orchestration
lib/integrations/    Google and Stripe adapters
lib/providers/       AI provider abstraction
lib/security/        Permissions and execution policies
types/               Shared TypeScript types
```

## Initial product flow

1. Create an agent.
2. Define its purpose and system instructions.
3. Select capabilities/tools.
4. Configure permissions and safety limits.
5. Test the agent in the sandbox.
6. Save a version.
7. Deploy or embed it.
8. Track usage and billing.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

See `.env.example`. Never commit live API keys.

## Status

Repository scaffold: MVP foundation.
