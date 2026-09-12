(function () {
  "use strict";
  var REG = window.FLYTHINK_REGISTER;

  var ADDRESS_SHAPE = /^0x[a-fA-F0-9]{40}$/;

  // GATE — a candidate only ever activates the contract UI if it is BOTH
  // address-shaped AND byte-for-byte equal to the one address the register
  // holds as "stated". A random address-shaped string (throwaway copy) is
  // expected to fail this on purpose — that failure is exercised in
  // gates/run-gates.js.
  function contractGateActive(candidate) {
    var c = REG.contract;
    if (c.status !== "stated") return false;
    if (typeof c.address !== "string" || !ADDRESS_SHAPE.test(c.address)) return false;
    return candidate === c.address;
  }

  function socialGateActive(entry) {
    return entry && entry.status === "stated" && typeof entry.url === "string" && entry.url.length > 0;
  }

  function fmt(n) {
    return n.toLocaleString("en-US");
  }

  function renderCaBar() {
    var c = REG.contract;
    var addrEl = document.getElementById("ca-address");
    var copyBtn = document.getElementById("ca-copy");
    var live = contractGateActive(c.address);

    if (live) {
      addrEl.textContent = c.address;
      addrEl.setAttribute("data-live", "true");
      copyBtn.disabled = false;
      copyBtn.setAttribute("data-live", "true");
    } else {
      addrEl.textContent = "no contract deployed yet";
      addrEl.removeAttribute("data-live");
      copyBtn.disabled = true;
      copyBtn.removeAttribute("data-live");
    }

    copyBtn.addEventListener("click", function () {
      if (!contractGateActive(c.address)) return;
      navigator.clipboard.writeText(c.address).then(function () {
        var fb = document.getElementById("ca-copy-feedback");
        fb.textContent = "copied";
        setTimeout(function () { fb.textContent = ""; }, 1800);
      });
    });
  }

  function renderSocialNav() {
    REG.social.forEach(function (entry) {
      var linkEl = document.querySelector('[data-gate="social-' + entry.id + '"]');
      var handleEl = document.querySelector('[data-gate="social-' + entry.id + '-handle"]');
      if (!linkEl) return;
      if (socialGateActive(entry)) {
        linkEl.href = entry.url;
        linkEl.removeAttribute("data-inert");
        if (handleEl) handleEl.textContent = entry.handle;
      } else {
        linkEl.removeAttribute("href");
        linkEl.setAttribute("data-inert", "true");
        linkEl.setAttribute("aria-disabled", "true");
        if (handleEl) handleEl.textContent = "unconfirmed";
      }
    });
  }

  function renderHero() {
    document.getElementById("meta-substrate").textContent =
      REG.selfStated.status === "stated" ? fmt(REG.selfStated.neuronCount) + " NEURONS" : "UNCONFIRMED";
    document.getElementById("meta-chain").textContent =
      REG.chain.status === "stated" ? REG.chain.name.toUpperCase() : "UNCONFIRMED";

    document.getElementById("stat-neurons").textContent =
      REG.selfStated.status === "stated" ? fmt(REG.selfStated.neuronCount) + " NEURONS · STATED" : "NEURON COUNT — UNCONFIRMED";
    document.getElementById("stat-chain-id").textContent =
      REG.chain.status === "stated" ? "CHAIN ID " + REG.chain.chainIdDec + " (" + REG.chain.chainIdHex + ")" : "CHAIN — UNCONFIRMED";

    var live = contractGateActive(REG.contract.address);
    var pill = document.getElementById("status-pill");
    pill.setAttribute("data-live", live ? "true" : "false");
    pill.querySelector(".status-pill__text").textContent = live ? "CONTRACT LIVE" : "AWAITING DEPLOYMENT";

    var clockEl = document.getElementById("stat-clock");
    function tick() {
      var d = new Date();
      clockEl.textContent = d.toISOString().substr(11, 8) + " UTC";
    }
    tick();
    setInterval(tick, 1000);
  }

  function renderRegisterGrid() {
    var grid = document.getElementById("register-grid");
    var rows = [
      { label: "CONTRACT ADDRESS", status: REG.contract.status, value: contractGateActive(REG.contract.address) ? REG.contract.address : "not deployed", note: REG.contract.note },
      { label: "CHAIN", status: REG.chain.status, value: REG.chain.name + " · id " + REG.chain.chainIdDec, note: "Source: " + REG.chain.source },
      { label: "NEURON COUNT", status: REG.selfStated.status, value: fmt(REG.selfStated.neuronCount), note: "Source: " + REG.selfStated.source },
      { label: "LIVE TELEMETRY", status: REG.liveTelemetry.status, value: "no public feed", note: REG.liveTelemetry.note }
    ];
    grid.innerHTML = rows.map(function (r) {
      return (
        '<div class="reg-card">' +
        '<span class="reg-card__label">' + r.label + '</span>' +
        '<span class="reg-card__value">' + r.value + '</span>' +
        '<span class="reg-card__status" data-status="' + r.status + '">' + r.status.toUpperCase() + '</span>' +
        '<p class="reg-card__note">' + r.note + '</p>' +
        '</div>'
      );
    }).join("");
  }

  function renderIdentityGrid() {
    var grid = document.getElementById("identity-grid");
    grid.innerHTML = REG.social.map(function (entry) {
      var active = socialGateActive(entry);
      var href = active ? entry.url : "#";
      var inert = active ? "" : ' data-inert="true" aria-disabled="true"';
      return (
        '<a class="id-card__link" href="' + href + '" target="_blank" rel="noopener noreferrer"' + inert + '>' +
        '<div class="id-card">' +
        '<span class="id-card__label">' + entry.label.toUpperCase() + '</span>' +
        '<span class="id-card__handle">' + entry.handle + '</span>' +
        '<span class="id-card__verify">' + (active ? entry.verification : "unconfirmed") + '</span>' +
        '</div></a>'
      );
    }).join("");
  }

  function renderChainGrid() {
    var grid = document.getElementById("chain-grid");
    var c = REG.chain;
    var rows = [
      { label: "NAME", value: c.name },
      { label: "CHAIN ID", value: c.chainIdDec + " (" + c.chainIdHex + ")" },
      { label: "RPC", value: c.rpc },
      { label: "STATED", value: c.statedAt + " — " + c.source }
    ];
    grid.innerHTML = rows.map(function (r) {
      return (
        '<div class="chain-card">' +
        '<span class="chain-card__label">' + r.label + '</span>' +
        '<span class="chain-card__value">' + r.value + '</span>' +
        '</div>'
      );
    }).join("");
  }

  function renderSequence() {
    var list = document.getElementById("sequence-list");
    list.innerHTML = REG.sequence.map(function (s) {
      return (
        '<li class="sequence__item">' +
        '<span class="sequence__id">' + s.id + '</span>' +
        '<div><p class="sequence__label">' + s.label + '</p><p class="sequence__detail">' + s.detail + '</p></div>' +
        '<span class="sequence__state" data-state="' + s.state + '">' + s.state.toUpperCase() + '</span>' +
        '</li>'
      );
    }).join("");
  }

  function renderFooter() {
    var count = REG.social.filter(socialGateActive).length;
    document.getElementById("footer-count").textContent = count + " verified channel" + (count === 1 ? "" : "s");
  }

  renderCaBar();
  renderSocialNav();
  renderHero();
  renderRegisterGrid();
  renderIdentityGrid();
  renderChainGrid();
  renderSequence();
  renderFooter();

  // Exposed for gates/run-gates.js (jsdom) to exercise the gate logic directly.
  window.__flythinkGates = { contractGateActive: contractGateActive, socialGateActive: socialGateActive, ADDRESS_SHAPE: ADDRESS_SHAPE };
})();
