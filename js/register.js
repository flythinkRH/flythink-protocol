/*
  REGISTER — every external fact lives here exactly once.
  status is one of: "stated" | "absent" | "unconfirmed".
  Rendering code must branch on status; nothing here is guessed.
*/
window.FLYTHINK_REGISTER = {
  contract: {
    status: "absent",
    address: null,
    pair: null,
    supply: null,
    tax: null,
    note: "No token has been deployed yet. This slot activates the moment one is."
  },

  chain: {
    status: "stated",
    name: "Robinhood Chain",
    chainIdHex: "0x1237",
    chainIdDec: 4663,
    rpc: "https://rpc.mainnet.chain.robinhood.com",
    source: "client statement, 2026-09-02, batch-level",
    statedAt: "2026-09-02"
  },

  social: [
    {
      id: "x",
      label: "X",
      handle: "@flythinkRH",
      url: "https://x.com/flythinkRH",
      status: "stated",
      verifiedAt: "2026-09-12",
      verification: "fetched logged out, HTTP 200, page title and handle matched, account joined September 2026"
    },
    {
      id: "github",
      label: "GitHub",
      handle: "flythinkRH/flythink-protocol",
      url: "https://github.com/flythinkRH/flythink-protocol",
      status: "stated",
      verifiedAt: "2026-09-12",
      verification: "fetched without following redirects, HTTP 200, repository title matched"
    }
  ],

  // Facts the project has stated about itself, on its own verified channel (X bio).
  // These are dataset/identity facts, not live telemetry — Flythink runs no public
  // simulation feed yet, so no per-second figures are claimed anywhere on this page.
  selfStated: {
    status: "stated",
    source: "X bio, https://x.com/flythinkRH, read 2026-09-12",
    neuronCount: 165122,
    summary: "a fly brain, wired to read the open internet"
  },

  // Anything that would require a live backend we do not run. Left explicit
  // and inert rather than invented.
  liveTelemetry: {
    status: "absent",
    note: "No simulation feed is public yet. This panel lights up when one is."
  },

  sequence: [
    { id: "01", label: "Connectome sourced", detail: "165,122 traced neurons identified as the substrate, per the project's own account.", state: "done" },
    { id: "02", label: "Identity claimed", detail: "X account and GitHub repository registered and verified live.", state: "done" },
    { id: "03", label: "Chain selected", detail: "Robinhood Chain confirmed as the deployment target.", state: "done" },
    { id: "04", label: "Contract deployed", detail: "No address exists yet. This is the next real step, not a promise of one.", state: "pending" },
    { id: "05", label: "Telemetry opened", detail: "A public read on the running process, once there is a process to read.", state: "pending" }
  ]
};
