const $ = (sel) => document.querySelector(sel);

const state = {
  tasks: [],
  index: 0,
  answers: [],
  selectedChoice: null,
  current: null
};

function show(id) {
  ["intro", "decisionView", "outcomeView", "reviewView", "resultView"].forEach((x) => {
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

function renderDecision() {
  const task = state.tasks[state.index];
  state.selectedChoice = null;
  state.current = null;

  const current = state.index + 1;
  $("#progressText").textContent = `${current} / ${state.tasks.length}`;
  $("#progressBar").style.width = `${(current / state.tasks.length) * 100}%`;

  $("#taskId").textContent = task.id;
  $("#taskTitle").textContent = task.prompt.title;
  $("#goal").textContent = task.prompt.goal;
  $("#information").innerHTML = `<ul>${task.prompt.information.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
  $("#reason").value = "";
  $("#preQuality").value = 50;
  $("#preQualityValue").textContent = "50";

  const list = $("#choiceList");
  list.innerHTML = "";
  task.prompt.choices.forEach((choice) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice-card";
    b.innerHTML = `<strong>${choice.id}</strong><span>${escapeHtml(choice.label)}</span>`;
    b.addEventListener("click", () => {
      state.selectedChoice = choice.id;
      list.querySelectorAll(".choice-card").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    });
    list.appendChild(b);
  });

  show("decisionView");
}

function renderOutcome() {
  const task = state.tasks[state.index];
  const choice = task.prompt.choices.find((c) => c.id === state.selectedChoice);
  $("#outcomeTitle").textContent = task.prompt.title;
  $("#outcomeText").textContent = choice.outcome;
  $("#postQuality").value = state.current.pre_quality_rating;
  $("#postQualityValue").textContent = String(state.current.pre_quality_rating);
  $("#postReason").value = "";
  show("outcomeView");
}

function renderReview() {
  const task = state.tasks[state.index];
  const a = state.current;
  const delta = a.post_quality_rating - a.pre_quality_rating;
  const choice = task.prompt.choices.find((c) => c.id === a.choice_id);

  $("#reviewTitle").textContent = task.prompt.title;
  $("#qualityDelta").innerHTML = `
    <p><strong>選択:</strong> ${escapeHtml(choice.label)}</p>
    <p><strong>結果:</strong> ${choice.outcome_valence === "good" ? "目的に対して良い結果" : "目的に対して悪い結果"}</p>
    <p><strong>結果を見る前:</strong> ${a.pre_quality_rating}%</p>
    <p><strong>結果を見た後:</strong> ${a.post_quality_rating}%</p>
    <p><strong>評価変化:</strong> ${delta > 0 ? "+" : ""}${delta}ポイント</p>
  `;
  $("#processReference").innerHTML = `
    <p>${escapeHtml(task.prompt.process_reference)}</p>
    <p><strong>最初に書いた理由:</strong> ${escapeHtml(a.pre_reason || "記入なし")}</p>
    <p><strong>結果後の理由:</strong> ${escapeHtml(a.post_reason || "記入なし")}</p>
  `;
  show("reviewView");
}

function saveSession() {
  localStorage.setItem("thinking-map:duke:last-session", JSON.stringify({
    version: "v3-wave1-duke-prototype",
    completed_at: new Date().toISOString(),
    family: "outcome_blind_decision",
    answers: state.answers
  }));
}

function renderResults() {
  saveSession();

  const n = state.answers.length;
  const avgAbsShift = Math.round(
    state.answers.reduce((s, a) => s + Math.abs(a.result_shift), 0) / Math.max(n, 1)
  );
  const outcomeAligned = state.answers.filter((a) => {
    if (a.outcome_valence === "good") return a.result_shift > 0;
    if (a.outcome_valence === "bad") return a.result_shift < 0;
    return false;
  }).length;

  $("#summary").innerHTML = `
    <p><strong>平均の判断品質評価の変化量:</strong> ${avgAbsShift}ポイント</p>
    <p><strong>結果の良し悪しと同じ方向へ評価が動いた課題:</strong> ${outcomeAligned} / ${n}</p>
    <p class="muted">
      結果と同じ方向に評価が動いても、それだけでバイアスと断定はしません。
      判断時点では知らなかった結果情報が、過去の判断評価へどれほど影響したかを見るための記録です。
    </p>
  `;

  $("#taskBreakdown").innerHTML = state.answers.map((a, idx) => `
    <div class="result-row">
      <strong>${idx + 1}. ${escapeHtml(a.title)}</strong>
      <div>選択 ${escapeHtml(a.choice_id)} / ${a.pre_quality_rating}% → ${a.post_quality_rating}%（${a.result_shift > 0 ? "+" : ""}${a.result_shift}）</div>
      <div class="muted">結果: ${a.outcome_valence === "good" ? "良い" : "悪い"}</div>
    </div>
  `).join("");

  show("resultView");
}

async function init() {
  try {
    const res = await fetch("./data/outcome_blind_decision.json");
    if (!res.ok) throw new Error("task load failed");
    state.tasks = await res.json();
  } catch (err) {
    $("#intro").innerHTML = "<h2>読み込みエラー</h2><p>問題データを読み込めませんでした。</p>";
    return;
  }

  $("#preQuality").addEventListener("input", (e) => {
    $("#preQualityValue").textContent = e.target.value;
  });

  $("#postQuality").addEventListener("input", (e) => {
    $("#postQualityValue").textContent = e.target.value;
  });

  $("#startBtn").addEventListener("click", () => {
    state.index = 0;
    state.answers = [];
    renderDecision();
  });

  $("#showOutcomeBtn").addEventListener("click", () => {
    if (!state.selectedChoice) {
      alert("AかBを選んでください。");
      return;
    }
    const task = state.tasks[state.index];
    const choice = task.prompt.choices.find((c) => c.id === state.selectedChoice);
    state.current = {
      task_id: task.id,
      title: task.prompt.title,
      family: task.family,
      primary_construct: task.primary_construct,
      process_lens: task.process_lens,
      phase: task.phase,
      choice_id: state.selectedChoice,
      pre_reason: $("#reason").value.trim(),
      pre_quality_rating: Number($("#preQuality").value),
      outcome_valence: choice.outcome_valence,
      outcome: choice.outcome,
      decided_at: new Date().toISOString()
    };
    renderOutcome();
  });

  $("#submitBtn").addEventListener("click", () => {
    state.current.post_quality_rating = Number($("#postQuality").value);
    state.current.post_reason = $("#postReason").value.trim();
    state.current.result_shift = state.current.post_quality_rating - state.current.pre_quality_rating;
    state.current.completed_at = new Date().toISOString();
    renderReview();
  });

  $("#nextBtn").addEventListener("click", () => {
    state.answers.push(state.current);
    state.current = null;
    state.index += 1;
    if (state.index >= state.tasks.length) renderResults();
    else renderDecision();
  });

  $("#restartBtn").addEventListener("click", () => {
    state.index = 0;
    state.answers = [];
    renderDecision();
  });

  $("#resetBtn").addEventListener("click", () => {
    localStorage.removeItem("thinking-map:duke:last-session");
    state.index = 0;
    state.answers = [];
    state.current = null;
    alert("この端末に保存した意思決定課題の試作記録を削除しました。");
    show("intro");
  });
}

init();