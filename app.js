(function () {
  const BLOCK_MINUTES = 5;
  const BLOCK_MS = BLOCK_MINUTES * 60 * 1000;
  // "Request a harder level" is sent to this form endpoint (e.g. a Formspree URL like
  // "https://formspree.io/f/abcdwxyz"), which forwards it to the maintainer's inbox.
  // The inbox address lives in the form service's settings, not in this page or repo.
  // While this is empty the request button is hidden.
  const REQUEST_ENDPOINT = "";
  // Smart shuffle looks at this many recent days when deciding what's overdue.
  const SMART_WINDOW_DAYS = 28;
  const KEYS = { session: "blocks.session", log: "blocks.log", levels: "blocks.levels", timer: "blocks.timer", requests: "blocks.requests" };

  // ---------- storage ----------
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }

  // session: { minutes, blocks: [{ uid, exerciseId, done }] } | null
  // log:     [{ uid, date: "YYYY-MM-DD", exerciseId, name, level, minutes }]
  // levels:  { [exerciseId]: index into that exercise's progressions }
  let session = load(KEYS.session, null);
  let log = load(KEYS.log, []);
  let levels = load(KEYS.levels, {});
  // timer: { uid (block), endAt (ms timestamp, null when paused), remaining (ms, valid when paused) } | null
  let timer = load(KEYS.timer, null);
  // requests: { "<exerciseId>:<levelCount>": sentAt ISO string }. Keyed on the level
  // count, so once a new level is added the exercise can be requested again.
  let requests = load(KEYS.requests, {});
  let requestBusy = null;    // exercise id currently being sent
  let requestFailed = null;  // exercise id whose last send failed
  let lastMinutes = (session && session.minutes) || 20;

  const byId = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

  // ---------- helpers ----------
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function dateKey(d) {
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  const today = () => dateKey(new Date());

  function parseDateKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, "");
      else if (v !== false && v != null) el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.append(c.nodeType ? c : document.createTextNode(c));
    }
    return el;
  }

  // ---------- progressions ----------
  // Current level for an exercise, clamped to what exists in exercises.js.
  function levelOf(ex) {
    const max = (ex.progressions || []).length - 1;
    return Math.max(0, Math.min(levels[ex.id] || 0, max));
  }
  function variantName(ex, level) {
    const p = ex.progressions && ex.progressions[level];
    return p ? p.name : ex.name;
  }
  function setLevel(ex, level) {
    levels[ex.id] = level;
    save(KEYS.levels, levels);
    render();
  }

  // At the top level there is nothing left to progress to, so offer to ask the
  // maintainer for more. With REQUEST_ENDPOINT set, one tap sends the request in
  // the background. Without it, just show that they're at the top.
  function requestMessage(ex) {
    const top = ex.progressions[ex.progressions.length - 1].name;
    const lines = [
      `Someone has reached the top level of "${ex.name}" (${top}) and is ready for a harder progression.`,
      "",
      "Current levels:",
      ...ex.progressions.map((p, i) => `${i + 1}. ${p.name}`),
    ];
    if (ex.suggestions && ex.suggestions.length) {
      lines.push("", "Suggested next levels:", ...ex.suggestions.map((s) => `- ${s}`));
    }
    lines.push("", `(exercise id: ${ex.id})`);
    return { subject: "Progression request: " + ex.name, body: lines.join("\n") };
  }

  const requestKey = (ex) => ex.id + ":" + ex.progressions.length;

  async function sendRequest(ex) {
    const { subject, body } = requestMessage(ex);
    requestBusy = ex.id;
    requestFailed = null;
    render();
    try {
      const res = await fetch(REQUEST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ _subject: subject, message: body, exercise: ex.name, exercise_id: ex.id }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      requests[requestKey(ex)] = new Date().toISOString();
      save(KEYS.requests, requests);
    } catch (e) {
      requestFailed = ex.id;
    }
    requestBusy = null;
    render();
  }

  function requestControl(ex) {
    if (!REQUEST_ENDPOINT) return h("span", { class: "hint" }, "Top level ✦");
    if (requests[requestKey(ex)]) {
      return h("span", { class: "hint" }, "Request sent ✓ A harder level is on the way.");
    }
    return h("span", { class: "row" },
      h("button", { class: "btn small", type: "button", disabled: requestBusy === ex.id, onclick: () => sendRequest(ex) },
        requestBusy === ex.id ? "Sending…" : "Request a harder level"),
      requestFailed === ex.id && h("span", { class: "hint" }, "Couldn't send. Please try again.")
    );
  }

  // "Ready to progress" moves up one level; "Back a level" undoes a mistap or
  // a move that turned out too hard. Past history keeps the level it was done at.
  function levelControls(ex) {
    const count = (ex.progressions || []).length;
    if (count < 2) return null;
    const level = levelOf(ex);
    const next = ex.progressions[level + 1];
    return h("div", { class: "levelbar" },
      next
        ? h("button", { class: "btn small", type: "button", onclick: () => setLevel(ex, level + 1) }, "Ready to progress ↑")
        : requestControl(ex),
      level > 0 && h("button", { class: "btn small", type: "button", onclick: () => setLevel(ex, level - 1) }, "Back a level"),
      next && h("span", { class: "hint" }, "Next: " + next.name)
    );
  }

  // ---------- smart randomizer ----------
  // Each exercise gets a weight, and picks are weighted-random, so nothing is
  // guaranteed but neglected exercises are much more likely:
  //
  //   weight = (1 + daysSinceLastDone / 7) / (1 + timesDoneInWindow)
  //
  // daysSinceLastDone is capped at SMART_WINDOW_DAYS, and "never done" counts
  // as the cap. So a never-done exercise weighs 5, while one done 3 times in
  // the window, most recently yesterday, weighs about 0.3.
  function exerciseWeights() {
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    const stats = {};
    for (const e of log) {
      const days = Math.round((midnight - parseDateKey(e.date)) / 86400000);
      if (days >= SMART_WINDOW_DAYS) continue;
      const s = stats[e.exerciseId] || (stats[e.exerciseId] = { n: 0, days: SMART_WINDOW_DAYS });
      s.n++;
      s.days = Math.min(s.days, Math.max(0, days));
    }
    const weights = {};
    for (const ex of EXERCISES) {
      const s = stats[ex.id] || { n: 0, days: SMART_WINDOW_DAYS };
      weights[ex.id] = (1 + s.days / 7) / (1 + s.n);
    }
    return weights;
  }

  function weightedPick(ids, weights) {
    let r = Math.random() * ids.reduce((sum, id) => sum + weights[id], 0);
    for (const id of ids) {
      r -= weights[id];
      if (r <= 0) return id;
    }
    return ids[ids.length - 1];
  }

  // An exercise never appears twice in one workout until every exercise has
  // appeared once. If there are more blocks than exercises, the pool refills
  // and we keep going, avoiding the same exercise twice in a row at the seam.
  function pickExercises(count) {
    const weights = exerciseWeights();
    const ids = [];
    while (ids.length < count) {
      let pool = EXERCISES.map((e) => e.id);
      while (pool.length && ids.length < count) {
        const last = ids[ids.length - 1];
        const candidates = pool.length > 1 ? pool.filter((id) => id !== last) : pool;
        const id = weightedPick(candidates, weights);
        ids.push(id);
        pool = pool.filter((x) => x !== id);
      }
    }
    return ids;
  }

  function generate(minutes) {
    const count = Math.floor(minutes / BLOCK_MINUTES);
    if (count < 1 || !EXERCISES.length) return;
    lastMinutes = count * BLOCK_MINUTES;
    clearTimer();
    session = {
      minutes: lastMinutes,
      blocks: pickExercises(count).map((exerciseId) => ({ uid: uid(), exerciseId, done: false })),
    };
    save(KEYS.session, session);
    render();
  }

  function reroll(block) {
    if (block.done) return;
    const inUse = new Set(session.blocks.map((b) => b.exerciseId));
    let pool = EXERCISES.filter((e) => !inUse.has(e.id));
    if (!pool.length) pool = EXERCISES.filter((e) => e.id !== block.exerciseId);
    if (!pool.length) return;
    if (timer && timer.uid === block.uid) clearTimer();
    block.exerciseId = weightedPick(pool.map((e) => e.id), exerciseWeights());
    save(KEYS.session, session);
    render();
  }

  // ---------- logging ----------
  // Checking a block logs it immediately; unchecking removes it again.
  function toggleDone(block) {
    const ex = byId[block.exerciseId];
    if (timer && timer.uid === block.uid) clearTimer();
    block.done = !block.done;
    if (block.done) {
      const level = levelOf(ex);
      log.push({
        uid: block.uid,
        date: today(),
        exerciseId: ex.id,
        name: variantName(ex, level),
        level,
        minutes: BLOCK_MINUTES,
      });
    } else {
      log = log.filter((e) => e.uid !== block.uid);
    }
    save(KEYS.session, session);
    save(KEYS.log, log);
    render();
  }

  function removeEntry(entryUid) {
    log = log.filter((e) => e.uid !== entryUid);
    if (session) {
      const b = session.blocks.find((x) => x.uid === entryUid);
      if (b) b.done = false;
      save(KEYS.session, session);
    }
    save(KEYS.log, log);
    render();
  }

  // ---------- timer ----------
  // One timer at a time, tied to a block. It stores an end timestamp rather
  // than counting ticks, so it stays accurate in a background tab and survives
  // a page refresh. When it hits zero the block is checked off automatically.
  let audioCtx = null;
  const baseTitle = document.title;

  function timerRemaining() {
    return timer.endAt ? timer.endAt - Date.now() : timer.remaining;
  }
  function formatClock(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }
  function persistTimer() {
    if (timer) save(KEYS.timer, timer);
    else try { localStorage.removeItem(KEYS.timer); } catch (e) { /* ignore */ }
  }
  function clearTimer() {
    timer = null;
    persistTimer();
    document.title = baseTitle;
    releaseScreen();
  }

  // Keep the screen from locking while a timer runs, so the countdown stays
  // visible and the chime can play. Not supported everywhere, so failures are ignored.
  let wakeLock = null;
  async function holdScreenAwake() {
    try {
      if (!("wakeLock" in navigator) || wakeLock) return;
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    } catch (e) { wakeLock = null; }
  }
  function releaseScreen() {
    if (wakeLock) wakeLock.release().catch(() => {});
    wakeLock = null;
  }
  // The lock is dropped whenever the page is hidden, so take it back on return.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && timer && timer.endAt) holdScreenAwake();
  });

  // Browsers only allow audio after a user gesture, so create the context on Start.
  function unlockAudio() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) { /* no audio available */ }
  }
  function chime() {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
    if (!audioCtx) return;
    [0, 0.3, 0.6].forEach((offset, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const t = audioCtx.currentTime + offset;
      osc.frequency.value = i === 2 ? 1046 : 784;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  function startTimer(block) {
    unlockAudio();
    timer = { uid: block.uid, endAt: Date.now() + BLOCK_MS, remaining: BLOCK_MS };
    persistTimer();
    holdScreenAwake();
    render();
  }
  function pauseTimer() {
    timer.remaining = Math.max(0, timer.endAt - Date.now());
    timer.endAt = null;
    persistTimer();
    document.title = baseTitle;
    releaseScreen();
    render();
  }
  function resumeTimer() {
    unlockAudio();
    timer.endAt = Date.now() + timer.remaining;
    persistTimer();
    holdScreenAwake();
    render();
  }
  function resetTimer() {
    clearTimer();
    render();
  }

  function finishTimer() {
    const block = session && session.blocks.find((b) => b.uid === timer.uid);
    clearTimer();
    chime();
    if (block && !block.done) toggleDone(block);
    else render();
  }

  setInterval(() => {
    if (!timer || !timer.endAt) return;
    const left = timer.endAt - Date.now();
    if (left <= 0) return finishTimer();
    const label = formatClock(left);
    const el = document.querySelector("[data-timer]");
    if (el) el.textContent = label;
    document.title = label + " · " + baseTitle;
  }, 250);

  function timerControls(block) {
    if (block.done) return null;
    if (!timer || timer.uid !== block.uid) {
      return h("div", { class: "timer" },
        h("button", { class: "btn small", type: "button", onclick: () => startTimer(block) }, `▶ Start ${BLOCK_MINUTES}:00`)
      );
    }
    const running = Boolean(timer.endAt);
    return h("div", { class: "timer active" },
      h("span", { class: "timer-time", "data-timer": true }, formatClock(timerRemaining())),
      h("button", { class: "btn small", type: "button", onclick: running ? pauseTimer : resumeTimer }, running ? "Pause" : "Resume"),
      h("button", { class: "btn small", type: "button", onclick: resetTimer }, "Reset")
    );
  }

  // A little burst of sparkles where a block was checked off. Purely decorative
  // (hidden for reduced-motion users in CSS).
  function sparkleBurst(x, y) {
    const glyphs = ["✦", "✧", "♥", "✦", "✧"];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
      const dist = 40 + Math.random() * 40;
      const s = h("span", { class: "spark", "aria-hidden": "true" }, glyphs[i % glyphs.length]);
      s.style.left = x + "px";
      s.style.top = y + "px";
      s.style.fontSize = 12 + Math.random() * 12 + "px";
      s.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      s.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      document.body.append(s);
      s.addEventListener("animationend", () => s.remove());
    }
  }

  // ---------- views: Today ----------
  function renderPlan() {
    const root = document.getElementById("plan");
    root.replaceChildren();

    const input = h("input", { type: "number", inputmode: "numeric", id: "minutes", min: BLOCK_MINUTES, step: BLOCK_MINUTES, value: lastMinutes });
    const go = () => generate(Number(input.value));
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });

    const quick = [10, 15, 20, 30, 45, 60].map((m) =>
      h("button", { class: "btn small", type: "button", onclick: () => { input.value = m; generate(m); } }, m)
    );

    root.append(
      h("div", { class: "panel controls" },
        h("label", { for: "minutes" }, "How many minutes do you have?"),
        h("div", { class: "row" },
          input,
          h("button", { class: "btn primary", type: "button", onclick: go }, session ? "New workout" : "Make my workout")
        ),
        h("div", { class: "row" }, quick),
        h("div", { class: "hint" }, `Each exercise is ${BLOCK_MINUTES} minutes. Picks are random, but exercises you haven't done lately come up more often.`)
      )
    );

    if (!session || !session.blocks.length) {
      root.append(h("p", { class: "empty" }, "Pick a time above to get started."));
      return;
    }

    const doneCount = session.blocks.filter((b) => b.done).length;
    root.append(
      h("div", { class: "summary" },
        h("strong", {}, `${session.blocks.length} exercises · ${session.minutes} min`),
        h("span", { class: "hint" }, `${doneCount} of ${session.blocks.length} done`)
      )
    );

    const list = h("ol", { class: "blocks" });
    session.blocks.forEach((block, i) => {
      const ex = byId[block.exerciseId];
      if (!ex) return;
      const level = levelOf(ex);
      const hasLevels = ex.progressions && ex.progressions.length > 0;
      const note = hasLevels && ex.progressions[level].note;

      list.append(
        h("li", { class: "block" + (block.done ? " done" : "") },
          h("button", {
            class: "check", type: "button", "aria-pressed": String(block.done),
            "aria-label": (block.done ? "Mark not done: " : "Mark done: ") + ex.name,
            onclick: (e) => {
              if (!block.done) sparkleBurst(e.clientX, e.clientY);
              toggleDone(block);
            },
          }, "♥"),
          h("div", {},
            h("div", { class: "name" }, hasLevels ? variantName(ex, level) : ex.name),
            h("div", { class: "meta" },
              h("span", {}, `Block ${i + 1} · ${BLOCK_MINUTES} min`),
              ex.category && h("span", { class: "tag" }, ex.category),
              hasLevels && h("span", { class: "tag level" }, `Level ${level + 1} of ${ex.progressions.length}`)
            ),
            ex.description && h("p", { class: "desc" }, ex.description),
            note && h("p", { class: "desc note" }, note),
            timerControls(block),
            levelControls(ex)
          ),
          h("button", { class: "btn small", type: "button", disabled: block.done, onclick: () => reroll(block) }, "Swap")
        )
      );
    });
    root.append(list);
  }

  // ---------- views: History ----------
  function renderHistory() {
    const root = document.getElementById("history");
    root.replaceChildren();

    if (!log.length) {
      root.append(h("p", { class: "empty" }, "Nothing logged yet. Check off an exercise on the Today tab."));
      root.append(dataPanel());
      return;
    }

    const minutesByDate = {};
    for (const e of log) minutesByDate[e.date] = (minutesByDate[e.date] || 0) + e.minutes;
    const dates = Object.keys(minutesByDate).sort().reverse();

    // last 7 days total
    const weekAgo = new Date(); weekAgo.setHours(0, 0, 0, 0); weekAgo.setDate(weekAgo.getDate() - 6);
    const weekMinutes = log.filter((e) => parseDateKey(e.date) >= weekAgo).reduce((s, e) => s + e.minutes, 0);

    root.append(
      h("div", { class: "stats" },
        stat(dates.length, "active days"),
        stat(log.reduce((s, e) => s + e.minutes, 0), "total minutes"),
        stat(weekMinutes, "last 7 days (min)")
      )
    );

    // 14-day bar chart
    root.append(h("h2", {}, "Last 14 days"));
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push(d);
    }
    const max = Math.max(5, ...days.map((d) => minutesByDate[dateKey(d)] || 0));
    root.append(
      h("div", { class: "chart", role: "img", "aria-label": "Minutes exercised per day for the last 14 days" },
        days.map((d) => {
          const m = minutesByDate[dateKey(d)] || 0;
          const bar = h("div", { class: "bar" + (m ? "" : " zero"), title: `${d.toLocaleDateString()}: ${m} min` });
          if (m) bar.style.height = Math.round((m / max) * 85) + "%";
          return h("div", { class: "bar-col" }, bar, h("div", { class: "bar-label" }, String(d.getDate())));
        })
      )
    );

    // by day
    root.append(h("h2", {}, "By day"));
    for (const date of dates) {
      const entries = log.filter((e) => e.date === date);
      root.append(
        h("div", { class: "day" },
          h("div", { class: "day-head" },
            parseDateKey(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
            h("span", {}, `${entries.length} exercises · ${minutesByDate[date]} min`)
          ),
          entries.map((e) =>
            h("div", { class: "entry" },
              h("span", {}, e.name),
              h("button", { class: "x", type: "button", "aria-label": "Remove " + e.name, title: "Remove", onclick: () => removeEntry(e.uid) }, "×")
            )
          )
        )
      );
    }

    // per exercise
    const counts = {};
    for (const e of log) {
      const c = counts[e.exerciseId] || (counts[e.exerciseId] = { name: (byId[e.exerciseId] || {}).name || e.name, n: 0 });
      c.n++;
    }
    root.append(h("h2", {}, "Times done"));
    root.append(
      h("table", { class: "counts" },
        h("tbody", {},
          Object.values(counts).sort((a, b) => b.n - a.n).map((c) =>
            h("tr", {}, h("td", {}, c.name), h("td", {}, `${c.n}×`))
          )
        )
      )
    );

    root.append(dataPanel());
  }

  function stat(value, label) {
    return h("div", { class: "stat" }, h("b", {}, String(value)), h("span", {}, label));
  }

  // ---------- backup ----------
  // Data lives in this browser only, so offer a way to save and restore it.
  function dataPanel() {
    const fileInput = h("input", { type: "file", accept: ".json,application/json", hidden: true });
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!Array.isArray(data.log)) throw new Error("no log");
        if (!confirm("Replace the current history with this backup?")) return;
        log = data.log;
        levels = data.levels || {};
        save(KEYS.log, log);
        save(KEYS.levels, levels);
        render();
      } catch (e) {
        alert("That file doesn't look like a backup from this app.");
      }
    });

    return h("div", {},
      h("h2", {}, "Backup"),
      h("p", { class: "hint" }, "History is stored in this browser only. Export a copy now and then."),
      h("div", { class: "row" },
        h("button", { class: "btn", type: "button", onclick: exportData }, "Export"),
        h("button", { class: "btn", type: "button", onclick: () => fileInput.click() }, "Import"),
        fileInput
      )
    );
  }

  // On iPhone the share sheet ("Save to Files", AirDrop, Mail...) is far more
  // reliable than a download link, especially from a home-screen app.
  async function exportData() {
    const name = `exercise-history-${today()}.json`;
    const json = JSON.stringify({ log, levels }, null, 2);
    try {
      const file = new File([json], name, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return; // person closed the share sheet
    }
    const blob = new Blob([json], { type: "application/json" });
    const a = h("a", { href: URL.createObjectURL(blob), download: name });
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  // ---------- shell ----------
  function render() {
    renderPlan();
    renderHistory();
  }

  document.querySelectorAll("nav [data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("nav [data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
      document.getElementById("plan").hidden = btn.dataset.tab !== "plan";
      document.getElementById("history").hidden = btn.dataset.tab !== "history";
    });
  });

  render();
  if (timer && timer.endAt) holdScreenAwake();

  // Lets the app open with no signal (e.g. in a gym) once it has been loaded once.
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
