(function () {
  const vscode = acquireVsCodeApi();
  const root = document.getElementById("root");
  const cases = new Map(); // index → DOM node

  function el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    for (const k of Object.keys(attrs)) {
      if (k === "class") e.className = attrs[k];
      else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    for (const c of children) {
      if (c == null) continue;
      e.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return e;
  }

  function badge(verdict) {
    const cls = {
      Passed: "ok",
      "Wrong Answer": "wa",
      Timeout: "tle",
      "Runtime Error": "rte",
      "Compile Error": "ce",
      Pending: "pending",
      Judging: "pending",
      AC: "ok",
      WA: "wa",
      TLE: "tle",
      MLE: "tle",
      RTE: "rte",
      CE: "ce",
    }[verdict] || "neutral";
    return el("span", { class: `badge ${cls}` }, verdict);
  }

  function renderCase(c) {
    const head = el(
      "div",
      { class: "head" },
      el("span", { class: "idx" }, `#${c.index}`),
      badge(c.verdict),
      el("span", { class: "detail" }, c.detail || "")
    );
    const body = el(
      "div",
      { class: "body" },
      el("div", { class: "io-block" },
        el("div", { class: "io-label" }, "Input"),
        el("pre", {}, c.input || "")
      ),
      el("div", { class: "io-block" },
        el("div", { class: "io-label" }, "Expected"),
        el("pre", {}, c.expected || "")
      ),
      el("div", { class: "io-block" },
        el("div", { class: "io-label" }, "Actual"),
        el("pre", {}, c.actual || "")
      ),
      el(
        "button",
        { class: "diff-btn", onClick: () => vscode.postMessage({ type: "openDiff", index: c.index }) },
        "View Diff in editor"
      )
    );
    const card = el("section", { class: "case", "data-idx": c.index }, head, body);
    head.addEventListener("click", () => card.classList.toggle("expanded"));
    return card;
  }

  function upsertCase(c) {
    const existing = cases.get(c.index);
    const next = renderCase(c);
    if (existing) {
      existing.replaceWith(next);
    } else {
      root.querySelector(".cases").append(next);
    }
    cases.set(c.index, next);
  }

  function renderShell(header) {
    root.innerHTML = "";
    const h = el("header", { class: "shell-head" }, el("h2", {}, header.title));
    const list = el("div", { class: "cases" });
    const foot = el("footer", { class: "shell-foot" });
    root.append(h, list, foot);
  }

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (msg.type === "header") {
      renderShell(msg);
      cases.clear();
    } else if (msg.type === "case") {
      upsertCase(msg.case);
    } else if (msg.type === "done") {
      const foot = root.querySelector(".shell-foot");
      foot.textContent = `${msg.summary.passed} / ${msg.summary.total} passed`;
    } else if (msg.type === "submission") {
      const foot = root.querySelector(".shell-foot");
      foot.innerHTML = "";
      foot.append(badge(msg.verdict));
      if (msg.finished) foot.append(document.createTextNode(" — final"));
    }
  });

  vscode.postMessage({ type: "ready" });
})();
