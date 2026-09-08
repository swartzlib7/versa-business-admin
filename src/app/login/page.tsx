import { Suspense } from "react";
import { getSiteSettingsFixture } from "@/lib/fixtures/site-settings";
import { users } from "@/lib/fixtures/users";
import { LoginForm, type InstallHints } from "./login-form";

function installHintsWhenDemo(): InstallHints | null {
  const demo = getSiteSettingsFixture().demo_mode !== false;
  if (!demo) return null;
  const human = users.find((u) => u.role === "admin" && u.type === "human");
  const agent = users.find((u) => u.role === "admin" && u.type === "agent");
  if (!human || !agent) return null;
  return {
    human: { name: human.name, email: human.email, password: human.password },
    agent: { name: agent.name, email: agent.email, password: agent.password },
  };
}

export default function LoginPage() {
  const installHints = installHintsWhenDemo();
  return (
    <Suspense fallback={null}>
      <LoginForm installHints={installHints} />
    </Suspense>
  );
}
