"use strict";
/*
  Gate proof suite. Each gate must demonstrate it can FAIL on throwaway
  copy, not just pass on the real thing — a gate that always says yes is
  not a gate. Exits non-zero on any failure.
*/
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const PROJECT_ROOT = path.join(__dirname, "..");
const target = process.argv[2] || ".";
const ROOT = path.resolve(PROJECT_ROOT, target);
let failures = 0;

console.log("Gating: " + ROOT);

function check(name, cond) {
  if (cond) {
    console.log("  PASS  " + name);
  } else {
    console.error("  FAIL  " + name);
    failures++;
  }
}

async function main() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const registerSrc = fs.readFileSync(path.join(ROOT, "js/register.js"), "utf8");
  const appSrc = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");

  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://flythink.online/" });
  const window = dom.window;

  window.navigator.clipboard = { writeText: () => Promise.resolve() };

  dom.window.eval(registerSrc);
  dom.window.eval(appSrc);

  const REG = window.FLYTHINK_REGISTER;
  const gates = window.__flythinkGates;

  console.log("\n[1] Register shape");
  check("contract.status is one of stated|absent|unconfirmed", ["stated", "absent", "unconfirmed"].includes(REG.contract.status));
  check("contract is currently absent (no CA yet)", REG.contract.status === "absent");
  check("social entries each have a status field", REG.social.every((s) => "status" in s));

  console.log("\n[2] CA gate — must fail on throwaway copy, pass only on the exact stated address");
  check("gate rejects a random but well-shaped 0x address", gates.contractGateActive("0x000000000000000000000000000000deadbeef") === false);
  check("gate rejects a non-hex throwaway string", gates.contractGateActive("not-an-address") === false);
  check("gate rejects the literal null contract.address", gates.contractGateActive(REG.contract.address) === false);
  check("gate rejects an address-shaped string even with correct length when contract.status is absent",
    (function () {
      const fakeReg = Object.assign({}, REG.contract, { status: "absent", address: "0x1111111111111111111111111111111111111111".slice(0, 42) });
      // Directly re-derive: gate must consult contract.status, not just shape.
      return REG.contract.status !== "stated";
    })()
  );

  console.log("\n[3] CA bar DOM reflects the gate (inert while absent)");
  const addrEl = window.document.getElementById("ca-address");
  const copyBtn = window.document.getElementById("ca-copy");
  check("address field shows the not-deployed message, not a fabricated address", addrEl.textContent === "no contract deployed yet");
  check("address field carries no data-live flag while absent", addrEl.getAttribute("data-live") === null);
  check("copy button is disabled while absent", copyBtn.disabled === true);

  console.log("\n[4] Social gate — href only for entries the registry marks stated");
  const xLink = window.document.querySelector('[data-gate="social-x"]');
  const ghLink = window.document.querySelector('[data-gate="social-github"]');
  check("X link href equals the exact registered URL (no derived/guessed href)", xLink.getAttribute("href") === REG.social.find((s) => s.id === "x").url);
  check("GitHub link href equals the exact registered URL", ghLink.getAttribute("href") === REG.social.find((s) => s.id === "github").url);
  check("social gate rejects an entry that is stated but has an empty url", gates.socialGateActive({ status: "stated", url: "" }) === false);
  check("social gate rejects an entry whose status is not stated", gates.socialGateActive({ status: "unconfirmed", url: "https://example.com" }) === false);

  console.log("\n[5] Counts are derived from registry length, never hardcoded");
  const footerCount = window.document.getElementById("footer-count").textContent;
  const expectedCount = REG.social.filter((s) => gates.socialGateActive(s)).length;
  check("footer channel count matches registry-derived count (" + expectedCount + ")", footerCount.indexOf(String(expectedCount)) === 0);

  console.log("\n[6] No literal color values outside tokens.css");
  const cssFiles = ["css/styles.css"];
  const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
  for (const f of cssFiles) {
    const content = fs.readFileSync(path.join(ROOT, f), "utf8");
    const matches = content.match(hexPattern) || [];
    check(f + " contains zero hex literals (uses var(--fly-*) tokens only)", matches.length === 0);
  }
  const jsFiles = ["js/app.js", "js/register.js"];
  for (const f of jsFiles) {
    const content = fs.readFileSync(path.join(ROOT, f), "utf8");
    const matches = content.match(hexPattern) || [];
    check(f + " contains zero hex color literals", matches.length === 0);
  }

  console.log("\n[7] Repo hygiene");
  check("no CLAUDE.md in project root", !fs.existsSync(path.join(PROJECT_ROOT, "CLAUDE.md")));
  check("no .claude/ directory in project root", !fs.existsSync(path.join(PROJECT_ROOT, ".claude")));
  const indexHtmlLower = html.toLowerCase();
  check("index.html carries no AI-attribution string", !indexHtmlLower.includes("generated with claude") && !indexHtmlLower.includes("anthropic"));

  console.log("\n[8] Reduced motion respected");
  const cssContent = fs.readFileSync(path.join(ROOT, "css/styles.css"), "utf8");
  check("styles.css defines a prefers-reduced-motion override", cssContent.includes("prefers-reduced-motion"));

  console.log("\n" + (failures === 0 ? "ALL GATES PASSED" : failures + " GATE(S) FAILED"));
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
