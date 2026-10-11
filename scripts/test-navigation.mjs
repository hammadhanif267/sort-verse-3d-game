import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { internalRouteUrl, isSameDestination } from "../src/lib/navigation.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const base = "https://localhost/";
const routeNames = ["/", "/levels", "/gameplay", "/daily", "/city", "/ranking", "/profile", "/settings"];

for (const route of routeNames) {
  const routeFile = route === "/" ? join(root, "src/app/page.js") : join(root, "src/app", route.slice(1), "page.js");
  assert.equal(statSync(routeFile).isFile(), true, `Missing screen: ${route}`);
  const destination = internalRouteUrl(route, base);
  assert.equal(new URL(destination).pathname, route === "/" ? "/" : `${route}/`);
}

assert.equal(internalRouteUrl("/gameplay?level=5&difficulty=hard", base), "https://localhost/gameplay/?level=5&difficulty=hard");
assert.equal(internalRouteUrl("//example.org/", base), null);
assert.equal(internalRouteUrl("https://example.org/", base), null);
assert.equal(isSameDestination("https://localhost/ranking", "https://localhost/ranking/"), true);
assert.equal(isSameDestination("https://localhost/gameplay/?level=2", "https://localhost/gameplay?level=3"), false);

function listSources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listSources(full);
    return /\.(?:js|jsx)$/.test(entry.name) ? [full] : [];
  });
}

let links = 0;
for (const file of listSources(join(root, "src"))) {
  const source = readFileSync(file, "utf8");
  if (file.endsWith("ReliableLink.jsx")) continue;
  assert.equal(source.includes('from "next/link"'), false, `Unwrapped mobile navigation link: ${file}`);
  for (const match of source.matchAll(/\bhref\s*=\s*["'](\/[^"']*)["']/g)) {
    const destination = internalRouteUrl(match[1], base);
    const route = (new URL(destination).pathname.replace(/\/$/, "") || "/");
    assert.ok(routeNames.includes(route), `Unknown navigation destination ${match[1]} in ${file}`);
    links += 1;
  }
}

const bottomNav = readFileSync(join(root, "src/components/BottomNav.jsx"), "utf8");
for (const route of ["/", "/levels", "/ranking", "/profile"]) {
  assert.ok(bottomNav.includes(`href: "${route}"`), `Missing tab: ${route}`);
}
assert.ok(bottomNav.includes("min-h-12"), "Bottom navigation touch targets are too small");
assert.ok(readFileSync(join(root, "src/components/ReliableLink.jsx"), "utf8").includes("prefetch={false}"));

console.log(`Navigation checks passed: ${routeNames.length} routes, ${links} literal screen links, trailing-slash and query handling, mobile touch targets.`);
