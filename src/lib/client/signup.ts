import { solvedChallenge } from "@/lib/client/proof-of-work";

export type SignupResult = { ok: true } | { ok: false; message: string };

/** Send one visitor email to POST /api/public/subscribe. */
export async function submitSignup(email: string, honeypot: string, source: string): Promise<SignupResult> {
  try {
    const challenge = await solvedChallenge();
    const res = await fetch("/api/public/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, website: honeypot, source, challenge }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    if (!res.ok) return { ok: false, message: json.error?.message ?? "Could not sign you up. Please try again." };
    return { ok: true };
  } catch {
    return { ok: false, message: "Network error. Please try again." };
  }
}

/**
 * Sign-up inside a Full page HTML record. Mark a container `data-vba-signup` with an
 * email input and a button; `data-vba-signup-done` is shown on success. The system
 * wires it; page scripts are never run.
 */
export function wireSignups(root: ParentNode): void {
  for (const box of root.querySelectorAll<HTMLElement>("[data-vba-signup]")) {
    if (box.dataset.vbaWired) continue;
    box.dataset.vbaWired = "1";
    const input = box.querySelector<HTMLInputElement>('input[type="email"]');
    const button = box.querySelector<HTMLButtonElement>("button");
    const trap = box.querySelector<HTMLInputElement>('input[name="honeypot"], input[name="website"]');
    const done = box.querySelector<HTMLElement>("[data-vba-signup-done]");
    if (!input || !button) continue;
    const label = button.textContent ?? "";
    let note = box.querySelector<HTMLElement>("[data-vba-signup-error]");
    const send = async () => {
      const email = input.value.trim();
      if (!input.checkValidity() || !email) {
        input.reportValidity();
        return;
      }
      button.disabled = true;
      button.textContent = "Sending…";
      const result = await submitSignup(email, trap?.value ?? "", window.location.pathname);
      if (result.ok) {
        input.style.display = "none";
        button.style.display = "none";
        if (note) note.textContent = "";
        if (done) done.style.display = "block";
        return;
      }
      button.disabled = false;
      button.textContent = label;
      if (!note) {
        note = document.createElement("p");
        note.setAttribute("data-vba-signup-error", "");
        note.setAttribute("role", "alert");
        box.appendChild(note);
      }
      note.textContent = result.message;
    };
    button.addEventListener("click", (e) => {
      e.preventDefault();
      void send();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void send();
      }
    });
  }
}
