const $ = (sel) => document.querySelector(sel);

const STRATEGIES = [
  "登場物の見た目や題材が似ているかを見た",
  "誰が誰に何をするかを対応させた",
  "矢印や順番の形を頭の中で作った",
  "一度、元の話を抽象的なルールに言い換えた",
  "候補を1つずつ消去した",
  "ほぼ直感で選んだ"
];

const state = {
  tasks: [],
  index: 0,
  answers: [],
  currentChoice: null,
  pending: null
};

function show(id) {
  ["intro", "taskView", "reviewView", "resultView"].forEach((x) => {
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

function renderTask() {
  const task = state.tasks[state.index];
  state.currentChoice = null;

  const current = state.index + 1;
  $("#progressText").textContent = `${current} / ${state.tasks.length}`;
  $("#progressBar").style.width = `${(current / state.tasks.length) * 100}%`;

  $("#taskId").textContent = task.id;
  $("#taskTitle").textContent = task.prompt.title;
  $("#baseText").textContent = task.prompt.base;
  $("#question").textContent = task.prompt.question;
  $("#mapping").value = "";
  $("#mapping").placeholder = task.prompt.mapping_prompt;
  $("#confidence").value = 50;
  $("#confidenceValue").textContent = "50";

  const list = $("#choiceList");
  list.innerHTML = "";
  task.prompt.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-card";
    button.dataset.choiceId = choice.id;
    button.innerHTML = `<strong>${choice.id}</strong><span>${escapeHtml(choice.text)}</span>`;
    button.addEventListener("click", () => {
      state.currentChoice = choice.id;
      list.querySelectorAll(".choice-card").forEach((x) => x.classList.remove("selected"));
      button.classList.add("selected");
    });
    list.appendChild(button);
  });

  show("taskView");
}

function renderReview() {
  const task = state.tasks[state.index];
  const choice = task.prompt.choices.find((c) => c.id === state.pending.choice_id);
  const correct = Boolean(choice?.is_correct);
  const correctChoice = task.prompt.choices.find((c) => c.is_correct);

  $("#reviewTitle").textContent = task.prompt.title;
  $("#choiceResult").innerHTML = correct
    ? `<p><strong>選択: ${choice.id}</strong>。この問題では関係構造が一致しています。</p>
       <p class="muted">${escapeHtml(choice.surface_note)}</p>`
    : `<p><strong>選択: ${choice?.id || "未選択"}</strong>。この問題で構造が一致するのは <strong>${correctChoice.id}</strong> です。</p>
       <p class="muted">選んだ候補: ${escapeHtml(choice?.surface_note || "")}</p>
       <p class="muted">一致する候補: ${escapeHtml(correctChoice.surface_note)}</p>`;

  $("#reviewMapping").textContent = state.pending.mapping || "（対応説明なし）";
  $("#referenceMapping").innerHTML = `
    <p><strong>元の構造:</strong> ${escapeHtml(task.structure_fingerprint)}</p>
    <p><strong>対応例:</strong> ${escapeHtml(task.prompt.reference_mapping)}</p>
  `;

  const wrap = $("#strategyChoices");
  wrap.innerHTML = "";
  STRATEGIES.forEach((label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = label;
    b.addEventListener("click", () => {
      wrap.querySelectorAll(".chip").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
      state.pending.strategy = label;
    });
    wrap.appendChild(b);
  });

  show("reviewView");
}

function saveSession() {
  const payload = {
    version: "v3-wave1-gentner-prototype",
    completed_at: new Date().toISOString(),
    family: "structural_analogy",
    answers: state.answers
  };
  localStorage.setItem("thinking-map:gentner:last-session", JSON.stringify(payload));
}

function renderResults() {
  saveSession();

  const n = state.answers.length;
  const correct = state.answers.filter((a) => a.correct).length;
  const avgConfidence = Math.round(
    state.answers.reduce((s, a) => s + a.confidence, 0) / Math.max(n, 1)
  );

  const wrongHighConfidence = state.answers.filter((a) => !a.correct && a.confidence >= 75).length;
  const relationStrategies = state.answers.filter((a) =>
    ["誰が誰に何をするかを対応させた", "矢印や順番の形を頭の中で作った", "一度、元の話を抽象的なルールに言い換えた"].includes(a.strategy)
  ).length;

  $("#summary").innerHTML = `
    <p><strong>構造一致の選択:</strong> ${correct} / ${n}</p>
    <p><strong>平均自信:</strong> ${avgConfidence}%</p>
    <p><strong>不正解かつ自信75%以上:</strong> ${wrongHighConfidence}問</p>
    <p><strong>関係構造を意識したと自己報告した課題:</strong> ${relationStrategies} / ${n}</p>
    <p class="muted">
      正答数だけでなく、自信と解き方を一緒に保存しています。
      対応説明の内容は現段階では自動採点しません。
    </p>
  `;

  $("#taskBreakdown").innerHTML = state.answers.map((a, idx) => `
    <div class="result-row">
      <strong>${idx + 1}. ${escapeHtml(a.title)}</strong>
      <div>選択 ${escapeHtml(a.choice_id)} / ${a.correct ? "構造一致" : "構造不一致"} / 自信 ${a.confidence}%</div>
      <div class="muted">戦略: ${escapeHtml(a.strategy || "未選択")}</div>
      <div class="muted">対応説明: ${escapeHtml(a.mapping || "なし")}</div>
    </div>
  `).join("");

  show("resultView");
}

async function init() {
  try {
    const res = await fetch("./data/structural_analogy.json");
    if (!res.ok) throw new Error("task load failed");
    state.tasks = await res.json();
  } catch (err) {
    $("#intro").innerHTML = `
      <h2>読み込みエラー</h2>
      <p>問題データを読み込めませんでした。簡易HTTPサーバーまたは公開ページから開いてください。</p>
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
    if (!state.currentChoice) {
      alert("A〜Cのどれかを選んでください。");
      return;
    }

    const task = state.tasks[state.index];
    const selected = task.prompt.choices.find((c) => c.id === state.currentChoice);

    state.pending = {
      task_id: task.id,
      title: task.prompt.title,
      family: task.family,
      primary_construct: task.primary_construct,
      process_lens: task.process_lens,
      phase: task.phase,
      choice_id: state.currentChoice,
      correct: Boolean(selected?.is_correct),
      mapping: $("#mapping").value.trim(),
      confidence: Number($("#confidence").value),
      strategy: null,
      answered_at: new Date().toISOString()
    };

    renderReview();
  });

  $("#nextBtn").addEventListener("click", () => {
    state.answers.push(state.pending);
    state.pending = null;
    state.currentChoice = null;
    state.index += 1;

    if (state.index >= state.tasks.length) renderResults();
    else renderTask();
  });

  $("#restartBtn").addEventListener("click", () => {
    state.index = 0;
    state.answers = [];
    renderTask();
  });

  $("#resetBtn").addEventListener("click", () => {
    localStorage.removeItem("thinking-map:gentner:last-session");
    state.index = 0;
    state.answers = [];
    state.pending = null;
    state.currentChoice = null;
    alert("この端末に保存した Structural Analogy の試作記録を削除しました。");
    show("intro");
  });
}

init();