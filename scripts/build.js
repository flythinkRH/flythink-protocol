"use strict";
/*
  Assembles dist/ from only the files that are actually deployable —
  brand/, reference/, gates/, package.json and friends never leave the repo.
*/
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const ENTRIES = ["index.html", "css", "js", "assets"];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function main() {
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST, { recursive: true });

  for (const entry of ENTRIES) {
    const src = path.join(ROOT, entry);
    if (!fs.existsSync(src)) {
      throw new Error("Expected deployable entry missing: " + entry);
    }
    copyRecursive(src, path.join(DIST, entry));
    console.log("copied " + entry);
  }

  // favicon.svg also at dist root, for browsers that request /favicon.svg directly.
  fs.copyFileSync(path.join(ROOT, "assets", "favicon.svg"), path.join(DIST, "favicon.svg"));
  console.log("copied favicon.svg (root)");

  console.log("\nBuild complete: " + DIST);
}

main();
