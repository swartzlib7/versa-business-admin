# Sign in from a script

VBA's login asks for a small proof-of-work so bots can't hammer it. A script solves it in well under a second.

1. `GET /api/auth/challenge` → `{ data: { nonce, issued, difficulty, sig } }`.
2. Find a number `solution` where `sha256("<nonce>:<solution>")` (hex) starts with `difficulty` zeros.
3. `POST /api/auth/login` with `{ "email", "password", "challenge": { nonce, issued, difficulty, sig, solution } }`.
4. Keep the `Set-Cookie` session cookie and send it on every call. A first login with an install password may answer that the password must change: change it in the UI first.

```js
// Node 22+
import { createHash } from "node:crypto";
const base = "http://localhost:3200";
const { data: ch } = await (await fetch(`${base}/api/auth/challenge`)).json();
let solution = 0;
while (!createHash("sha256").update(`${ch.nonce}:${solution}`).digest("hex").startsWith("0".repeat(ch.difficulty))) solution++;
const res = await fetch(`${base}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: process.env.VBA_EMAIL, password: process.env.VBA_PASSWORD, challenge: { ...ch, solution } }),
});
const cookie = res.headers.get("set-cookie")?.split(";")[0]; // send as the Cookie header
```

Statistics capture (`/api/statistics/<id>/lines`) also accepts **HTTP Basic** (`-u email:password`) for monitoring scripts.
