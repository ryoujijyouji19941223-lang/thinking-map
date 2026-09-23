const $ = (sel) => document.querySelector(sel);

const state = {
  tasks: [],
  index: 0,
  answers: [],
  pendingAnswer: null
};

const STRATEGIES = [
  "文章を頭の中でそのまま追った",
  "場面をイメージした",
  "事実と推測を意識して分けた",
  "怪しい点・抜けを探した",
  "なんとなく直感で分けた",
  "うまく説明できない"
];

function show(id) {
  ["intro", "taskView", "reviewView", "resultView"].forEach((x) => {
    $("#" + x).classList.toggle("hidden", x !== id);
  });
}

function splitLines(text) {
  return text
    .split(/\n|。/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[\s　、。,.!?！？「」『』（）()]/g, "");
}

function overlapScore(userText, referenceItems) {
  const chunks = splitLines(userText).map(normalize);
  if (!chunks.length) return { hits: 0, total: referenceItems.length };

  let hits = 0;
  for (const ref of referenceItems) {
    const nref = normalize(ref);
    const matched = chunks.some((c) => {
      if (!c || !nref) return false;
      return c.includes(nref) || nref.includes(c);
    });
    if (matched) hits++;
  }
  return { hits, total: referenceItems.length };
}

function renderTask() {
  const task = state.tasks[state.index];
  $("#taskId").textContent = task.id;
  $("#taskMode").textContent = task.input_modality;
  $("#scenario").textContent = task.prompt.scenario;
  $("#facts").value = "";
  $("#inferences").value = "";
  $("#missing").value = "";
  $("#confidence").value = 50;
  $("#confidenceValue").textContent = "50";

  const current = state.index + 1;
  $("#progressText").textContent = `${current} / ${state.tasks.length}`;
  $("#progressBar").style.width = `${(current / state.tasks.length) * 100}%`;

  show("taskView");
  $("#facts").focus();
}

function makeReferenceHtml(task) {
  const r = task.prompt.reference;
  const section = (title, items) =>
    `<h4>${title}</h4><ul>${items.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;

  return [
    section("文章から確認できる事実の例", r.facts),
    section("考えられる推測の例", r.inference_examples),
    section("不足情報の例", r.missing_examples)
  ].join("");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderReview() {
  const task = state.tasks[state.index];
  const a = state.pendingAnswer;

  $("#reviewScenario").textContent = task.prompt.scenario;
  $("#reviewFacts").textContent = a.facts || "（未入力）";
  $("#reviewInferences").textContent = a.inferences || "（未入力）";
  $("#reviewMissing").textContent = a.missing || "（未入力）";
  $("#referencePoints").innerHTML = makeReferenceHtml(task);

  const wrap = $("#strategyChoices");
  wrap.innerHTML = "";
  STRATEGIES.forEach((label) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", () => {
      wrap.querySelectorAll(".chip").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
      state.pendingAnswer.strategy = label;
    });
    wrap.appendChild(b);
  });

  show("reviewView");
}

function buildObservation(task, answer) {
  const f = overlapScore(answer.facts, task.prompt.reference.facts);
  const i = overlapScore(answer.inferences, task.prompt.reference.inference_examples);
  const m = overlapScore(answer.missing, task.prompt.reference.missing_examples);

  return {
    fact_reference_hits: f.hits,
    fact_reference_total: f.total,
    inference_reference_hits: i.hits,
    inference_reference_total: i.total,
    missing_reference_hits: m.hits,
    missing_reference_total: m.total
  };
}

function saveSession() {
  const payload = {
    version: "v3-wave1-fim-prototype",
    completed_at: new Date().toISOString(),
    family: "fact_inference_missing",
    answers: state.answers
  };
  localStorage.setItem("thinking-map:fim:last-session", JSON.stringify(payload));
}

function renderResults() {
  saveSession();

  const n = state.answers.length;
  const avgConfidence = Math.round(
    state.answers.reduce((sum, a) => sum + a.confidence, 0) / Math.max(n, 1)
  );
  const factHits = state.answers.reduce((s, a) => s + a.observation.fact_reference_hits, 0);
  const factTotal = state.answers.reduce((s, a) => s + a.observation.fact_reference_total, 0);
  const missingHits = state.answers.reduce((s, a) => s + a.observation.missing_reference_hits, 0);
  const missingTotal = state.answers.reduce((s, a) => s + a.observation.missing_reference_total, 0);

  $("#summary").innerHTML = `
    <p><strong>回答した課題:</strong> ${n}問</p>
    <p><strong>平均自信:</strong> ${avgConfidence}%</p>
    <p><strong>参照事実と一致した記述:</strong> ${factHits} / ${factTotal}</p>
    <p><strong>参照した不足情報と一致した記述:</strong> ${missingHits} / ${missingTotal}</p>
    <p class="muted">
      自由文なので、現在の一致数は簡易的な文字列比較です。
      本番版では意味ベース採点または人手検証に置き換える前提です。
    </p>
  `;

  $("#taskBreakdown").innerHTML = state.answers.map((a, idx) => `
    <div class="result-row">
      <strong>${idx + 1}. ${escapeHtml(a.task_id)}</strong>
      <div class="muted">自信 ${a.confidence}% / 戦略: ${escapeHtml(a.strategy || "未選択")}</div>
      <div>事実: ${a.observation.fact_reference_hits} / ${a.observation.fact_reference_total}</div>
      <div>不足情報: ${a.observation.missing_reference_hits} / ${a.observation.missing_reference_total}</div>
    </div>
  `).join("");

  show("resultView");
}

async function init() {
  try {
    const res = await fetch("./data/fact_inference_missing.json");
    if (!res.ok) throw new Error("task load failed");
    state.tasks = await res.json();
  } catch (err) {
    $("#intro").innerHTML = `
      <h2>読み込みエラー</h2>
      <p>問題データを読み込めませんでした。ローカルで開く場合は簡易HTTPサーバー経由で開いてください。</p>
    `;
    return;
  }

  $("#confidence").addEventListener("input", (e) => {
    $("#confidenceValue").textContent = e.target.value;
  });

  $("#startBtn").addEventListener("click", () => {
    state.index = 0;
    state.answers = [];
    renderTask();
  });

  $("#submitBtn").addEventListener("click", () => {
    const facts = $("#facts").value.trim();
    const inferences = $("#inferences").value.trim();
    const missing = $("#missing").value.trim();

    if (!facts && !inferences && !missing) {
      alert("3欄すべて空のままでは記録できません。少なくとも1つは書いてください。");
      return;
    }

    state.pendingAnswer = {
      task_id: state.tasks[state.index].id,
      family: state.tasks[state.index].family,
      primary_construct: state.tasks[state.index].primary_construct,
      process_lens: state.tasks[state.index].process_lens,
      phase: state.tasks[state.index].phase,
      facts,
      inferences,
      missing,
      confidence: Number($("#confidence").value),
      strategy: null,
      answered_at: new Date().toISOString()
    };

    renderReview();
  });

  $("#nextBtn").addEventListener("click", () => {
    const task = state.tasks[state.index];
    state.pendingAnswer.observation = buildObservation(task, state.pendingAnswer);
    state.answers.push(state.pendingAnswer);
    state.pendingAnswer = null;
    state.index++;

    if (state.index >= state.tasks.length) {
      renderResults();
    } else {
      renderTask();
    }
  });

  $("#restartBtn").addEventListener("click", () => {
    state.index = 0;
    state.answers = [];
    renderTask();
  });

  $("#resetBtn").addEventListener("click", () => {
    localStorage.removeItem("thinking-map:fim:last-session");
    state.index = 0;
    state.answers = [];
    alert("この端末に保存した試作記録を削除しました。");
    show("intro");
  });
}

init();
