// Menu order helper sanity. Run: npx tsx __tmp/sanity_menu_order.ts
import { defaultNavHrefs, orderNavItems, sanitizeMenuOrder } from "../src/lib/nav";

let pass = 0;
let fail = 0;
function ok(cond: boolean, label: string) {
  if (cond) pass++;
  else {
    fail++;
    console.log("FAIL: " + label);
  }
}

const items = defaultNavHrefs().map((href) => ({ href }));
ok(items.some((i) => i.href === "/stats"), "catalog includes /stats");
ok(orderNavItems(items, ["/contact", "/dashboard"])[0].href === "/contact", "order: first is contact");
ok(orderNavItems(items, ["/contact", "/dashboard"]).at(-1)?.href !== "/contact", "order: remaining items appended");
ok(sanitizeMenuOrder(["/nope", "/dashboard"])?.join() === "/dashboard", "sanitize drops unknown hrefs");
ok(sanitizeMenuOrder([]) === null, "empty order rejected");
ok(sanitizeMenuOrder(["/dashboard", "/dashboard"])?.length === 1, "sanitize de-dupes");

console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
