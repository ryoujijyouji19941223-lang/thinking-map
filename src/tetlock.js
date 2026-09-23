const $ = (sel) => document.querySelector(sel);

const state = {
  tasks: [],
  index: 0,
  answers: [],
  current: null
};

function show(id) {
  ["intro", "initialView", "updateView", "reviewView", "resultView"].forEach((x) => {
    $("#" + x).classList.toggle("hidden", x !== id);
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function makeAllocationInputs(containerId, hypotheses, prefix, values={}) {
  const wrap = $("#" + containerId);
  wrap.innerHTML = "";
  hypotheses.forEach((h, idx) => {
    const row = document.createElement("label");
    row.className = "probability-row";
    row.innerHTML = `
      <span><strong>${h.id}</strong> ${escapeHtml(h.label)}</span>
      <span class="probability-input-wrap">
        <input id="${prefix}-${h.id}" type="number" min="0" max="100" step="5" value="${values[h.id] ?? (idx === 0 ? 40 : 30)}">
        <span>%</span>
      </span>
    `;
    wrap.appendChild(row);
  });
}

function readAllocation(prefix, hypotheses) {
  const out = {};
  hypotheses.forEach((h) => {
    const raw = Number($("#" + prefix + "-" + h.id).value);
    out[h.id] = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
  });
  return out;
}

function totalAllocation(obj) {
  return Object.values(obj).reduce((s, x) => s + Number(x || 0), 0);
}

function wireSum(prefix, hypotheses, sumId) {
  const update = () => {
    const sum = totalAllocation(readAllocation(prefix, hypotheses));
    const el = $("#" + sumId);
    el.textContent = `合計 ${sum}%`;
    el.classList.toggle("invalid", sum !== 100);
  };
  hypotheses.forEach((h) => $("#" + prefix + "-" + h.id).addEventListener("input", update));
  update();
}

function renderInitial() {
  const task = state.tasks[state.index];
  state.current = {
    task_id: task.id,
    title: task.prompt.title,
    family: task.family,
    primary_construct: task.primary_construct,
    process_lens: task.process_lens,
    phase: task.phase,
    initial: null,
    updated: null,
    initial_reason: "",
    update_reason: "",
    started_at: new Date().toISOString()
  };

  const current = state.index + 1;
  $("#progressText").textContent = `${current} / ${state.tasks.length}`;
  $("#progressBar").style.width = `${(current / state.tasks.length) * 100}%`;
  $("#taskId").textContent = task.id;
  $("#taskTitle").textContent = task.prompt.title;
  $("#initialText").textContent = task.prompt.initial;
  $("#initialReason").value = "";

  makeAllocationInputs("initialAllocations", task.prompt.hypotheses, "initial");
  wireSum("initial", task.prompt.hypotheses, "initialSum");
  show("initialView");
}

function renderUpdate() {
  const task = state.tasks[state.index];
  $("#updateTitle").textContent = task.prompt.title;
  $("#newEvidence").textContent = task.prompt.new_evidence;
  $("#updateReason").value = "";
  makeAllocationInputs("updatedAllocations", task.prompt.hypotheses, "updated", state.current.initial);
  wireSum("updated", task.prompt.hypotheses, "updatedSum");
  show("updateView");
}

function directionMatch(before, after, expected) {
  const delta = after - before;
  if (expected === "up") return delta > 0;
  if (expected === "down") return delta < 0;
  if (expected === "down_or_same") return delta <= 0;
  if (expected === "up_or_same") return delta >= 0;
  return true;
}

function analyzeUpdate(task, initial, updated) {
  const byHypothesis = {};
  let matches = 0;
  let total = 0;
  task.prompt.hypotheses.forEach((h) => {
    const expected = task.prompt.expected_direction[h.id];
    const delta = updated[h.id] - initial[h.id];
    const match = directionMatch(initial[h.id], updated[h.id], expected);
    byHypothesis[h.id] = { delta, expected, match };
    matches += match ? 1 : 0;
    total += 1;
  });
  return { byHypothesis, matches, total };
}

function renderReview() {
  const task = state.tasks[state.index];
  const a = state.current;
  const analysis = analyzeUpdate(task, a.initial, a.updated);
  a.analysis = analysis;

  $("#reviewTitle").textContent = task.prompt.title;
  $("#deltaTable").innerHTML = task.prompt.hypotheses.map((h) => {
    const d = analysis.byHypothesis[h.id];
    return `
      <div class="result-row">
        <strong>${h.id} ${escapeHtml(h.label)}</strong>
        <div>${a.initial[h.id]}% → ${a.updated[h.id]}%（${d.delta > 0 ? "+" : ""}${d.delta}）</div>
        <div class="muted">証拠が示す方向との整合: ${d.match ? "○" : "△"}</div>
      </div>
    `;
  }).join("");
  $("#explanation").textContent = task.prompt.explanation;
  show("reviewView");
}

function saveSession() {
  localStorage.setItem("thinking-map:tetlock:last-session", JSON.stringify({
    version: "v3-wave1-tetlock-prototype",
    completed_at: new Date().toISOString(),
    family: "probability_update",
    answers: state.answers
  }));
}

function renderResults() {
  saveSession();

  const totalMatches = state.answers.reduce((s, a) => s + a.analysis.matches, 0);
  const totalChecks = state.answers.reduce((s, a) => s + a.analysis.total, 0);
  const focusMoves = state.answers.map((a) => {
    const task = state.tasks.find((t) => t.id === a.task_id);
    const id = task.prompt.focus_hypothesis;
    return a.updated[id] - a.initial[id];
  });
  const avgFocusMove = Math.round(focusMoves.reduce((s, x) => s + x, 0) / Math.max(focusMoves.length, 1));

  $("#summary").innerHTML = `
    <p><strong>証拠の方向と一致した確率更新:</strong> ${totalMatches} / ${totalChecks}</p>
    <p><strong>各問題で主に支持された仮説の平均変化:</strong> ${avgFocusMove > 0 ? "+" : ""}${avgFocusMove}ポイント</p>
    <p class="muted">
      確率の絶対値に唯一の正解を置かず、「新情報でどちらへ動かしたか」を中心に見ています。
    </p>
  `;

  $("#taskBreakdown").innerHTML = state.answers.map((a, idx) => {
    const task = state.tasks.find((t) => t.id === a.task_id);
    return `
      <div class="result-row">
        <strong>${idx + 1}. ${escapeHtml(a.title)}</strong>
        <div>${task.prompt.hypotheses.map((h) => `${h.id}: ${a.initial[h.id]}→${a.updated[h.id]}%`).join(" / ")}</div>
        <div class="muted">更新理由: ${escapeHtml(a.update_reason || "記入なし")}</div>
      </div>
    `;
  }).join("");

  show("resultView");
}

async function init() {
  try {
    const res = await fetch("./data/probability_update.json");
    if (!res.ok) throw new Error("task load failed");
    state.tasks = await res.json();
  } catch (err) {
    $("#intro").innerHTML = "<h2>読み込みエラー</h2><p>問題データを読み込めませんでした。</p>";
    return;
  }

  $("#startBtn").addEventListener("click", () => {
    state.index = 0;
    state.answers = [];
    renderInitial();
  });

  $("#toEvidenceBtn").addEventListener("click", () => {
    const task = state.tasks[state.index];
    const initial = readAllocation("initial", task.prompt.hypotheses);
    if (totalAllocation(initial) !== 100) {
      alert("3つの確率の合計を100%にしてください。");
      return;
    }
    state.current.initial = initial;
    state.current.initial_reason = $("#initialReason").value.trim();
    renderUpdate();
  });

  $("#submitBtn").addEventListener("click", () => {
    const task = state.tasks[state.index];
    const updated = readAllocation("updated", task.prompt.hypotheses);
    if (totalAllocation(updated) !== 100) {
      alert("3つの確率の合計を100%にしてください。");
      return;
    }
    state.current.updated = updated;
    state.current.update_reason = $("#updateReason").value.trim();
    state.current.completed_at = new Date().toISOString();
    renderReview();
  });

  $("#nextBtn").addEventListener("click", () => {
    state.answers.push(state.current);
    state.current = null;
    state.index += 1;
    if (state.index >= state.tasks.length) renderResults();
    else renderInitial();
  });

  $("#restartBtn").addEventListener("click", () => {
    state.index = 0;
    state.answers = [];
    renderInitial();
  });

  $("#resetBtn").addEventListener("click", () => {
    localStorage.removeItem("thinking-map:tetlock:last-session");
    state.index = 0;
    state.answers = [];
    state.current = null;
    alert("この端末に保存した確率更新課題の試作記録を削除しました。");
    show("intro");
  });
}

init();