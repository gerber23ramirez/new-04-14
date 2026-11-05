import Builder from "./builder";

const features = [
  "Create and configure AI agents",
  "Assign goals, tools, and permissions",
  "Test agents before deployment",
  "Version agent configurations",
  "Connect Google services",
  "Handle paid plans with Stripe",
];

export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px", fontFamily: "Arial, sans-serif" }}>
      <p style={{ fontWeight: 700, letterSpacing: 1 }}>AGENTFORGE</p>
      <h1 style={{ fontSize: 48, marginBottom: 16 }}>Build useful AI agents without the integration mess.</h1>
      <p style={{ fontSize: 20, lineHeight: 1.6, maxWidth: 720 }}>
        Create an agent, define what it can do, test it safely, and deploy it from one workspace.
      </p>

      <section style={{ marginTop: 48 }}>
        <h2>MVP capabilities</h2>
        <ul style={{ lineHeight: 2 }}>
          {features.map((feature) => <li key={feature}>{feature}</li>)}
        </ul>
      </section>

      <Builder />
    </main>
  );
}
