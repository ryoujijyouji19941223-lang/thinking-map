const $ = (sel) => document.querySelector(sel);

const state = {
  tasks: [],
  taskIndex: 0,
  questionIndex: 0,
  currentTaskAnswers: [],
  allAnswers: [],
  selectedChoice: null
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

function currentTask() { return state.tasks[state.taskIndex]; }
function currentQuestion() { return currentTask().prompt.questions[state.questionIndex]; }

function renderTaskQuestion() {
  const task = currentTask();
  const q = currentQuestion();
  state.selectedChoice = null;

  const globalCurrent = state.taskIndex * 3 + state.questionIndex + 1;
  const total = state.tasks.length * 3;
  $("#progressText").textContent = `${globalCurrent} / ${total}`;
  $("#progressBar").style.width = `${(globalCurrent / total) * 100}%`;

  $("#taskId").textContent = task.id;
  $("#questionKind").textContent = q.label;
  $("#taskTitle").textContent = task.prompt.title;
  $("#modelText").textContent = task.prompt.model;
  $("#questionText").textContent = q.text;
  $("#confidence").value = 50;
  $("#confidenceValue").textContent = "50";
  $("#reason").value = "";

  const list = $("#choiceList");
  list.innerHTML = "";
  q.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-card";
    button.innerHTML = `<strong>${choice.id}</strong><span>${escapeHtml(choice.text)}</span>`;
    button.addEventListener("click", () => {
      state.selectedChoice = choice.id;
      list.querySelectorAll(".choice-card").forEach((x) => x.classList.remove("selected"));
      button.classList.add("selected");
    });
    list.appendChild(button);
  });

  show("taskView");
}

function renderReview() {
  const task = currentTask();
  $("#reviewTitle").textContent = task.prompt.title;

  $("#reviewRows").innerHTML = state.currentTaskAnswers.map((a) => `
    <div class="result-row">
      <strong>${escapeHtml(a.label)}: ${a.correct ? "構造上妥当" : "要再検討"}</strong>
      <div>選択 ${escapeHtml(a.choice_id)} / 自信 ${a.confidence}%</div>
      <div class="muted">理由: ${escapeHtml(a.reason || "記入なし")}</div>
    </div>
  `).join("");

  $("#explanation").textContent = task.prompt.explanation;
  show("reviewView");
}

function saveSession() {
  localStorage.setItem("thinking-map:pearl:last-session", JSON.stringify({
    version: "v3-wave1-pearl-prototype",
    completed_at: new Date().toISOString(),
    family: "intervention_counterfactual",
    answers: state.allAnswers
  }));
}

function renderResults() {
  saveSession();

  const total = state.allAnswers.length;
  const correct = state.allAnswers.filter((a) => a.correct).length;
  const byKind = ["observation", "intervention", "counterfactual"].map((kind) => {
    const rows = state.allAnswers.filter((a) => a.kind === kind);
    return {
      kind,
      correct: rows.filter((a) => a.correct).length,
      total: rows.length,
      confidence: rows.length ? Math.round(rows.reduce((s, a) => s + a.confidence, 0) / rows.length) : 0
    };
  });

  const labels = { observation:"観察", intervention:"介入", counterfactual:"反実仮想" };

  $("#summary").innerHTML = `
    <p><strong>全回答:</strong> ${correct} / ${total}</p>
    ${byKind.map((x) => `<p><strong>${labels[x.kind]}:</strong> ${x.correct} / ${x.total}（平均自信 ${x.confidence}%）</p>`).join("")}
    <p class="muted">正答率だけでなく、問いの種類ごとの自信も保存しています。</p>
  `;

  $("#taskBreakdown").innerHTML = state.tasks.map((task) => {
    const rows = state.allAnswers.filter((a) => a.task_id === task.id);
    return `
      <div class="result-row">
        <strong>${escapeHtml(task.prompt.title)}</strong>
        <div>${rows.map((a) => `${escapeHtml(a.label)} ${a.correct ? "○" : "×"}（${a.confidence}%）`).join(" / ")}</div>
      </div>
    `;
  }).join("");

  show("resultView");
}

async function init() {
  try {
    const res = await fetch("./data/intervention_counterfactual.json");
    if (!res.ok) throw new Error("task load failed");
    state.tasks = await res.json();
  } catch (err) {
    $("#intro").innerHTML = "<h2>読み込みエラー</h2><p>問題データを読み込めませんでした。</p>";
    return;
  }

  $("#confidence").addEventListener("input", (e) => {
    $("#confidenceValue").textContent = e.target.value;
  });

  $("#startBtn").addEventListener("click", () => {
    state.taskIndex = 0;
    state.questionIndex = 0;
    state.currentTaskAnswers = [];
    state.allAnswers = [];
    renderTaskQuestion();
  });

  $("#submitBtn").addEventListener("click", () => {
    if (!state.selectedChoice) {
      alert("A〜Cのどれかを選んでください。");
      return;
    }

    const task = currentTask();
    const q = currentQuestion();
    const selected = q.choices.find((c) => c.id === state.selectedChoice);

    const answer = {
      task_id: task.id,
      title: task.prompt.title,
      family: task.family,
      primary_construct: task.primary_construct,
      process_lens: task.process_lens,
      kind: q.kind,
      label: q.label,
      choice_id: state.selectedChoice,
      correct: Boolean(selected?.is_correct),
      confidence: Number($("#confidence").value),
      reason: $("#reason").value.trim(),
      answered_at: new Date().toISOString()
    };

    state.currentTaskAnswers.push(answer);
    state.allAnswers.push(answer);
    state.questionIndex += 1;

    if (state.questionIndex < task.prompt.questions.length) {
      renderTaskQuestion();
    } else {
      renderReview();
    }
  });

  $("#nextBtn").addEventListener("click", () => {
    state.taskIndex += 1;
    state.questionIndex = 0;
    state.currentTaskAnswers = [];

    if (state.taskIndex >= state.tasks.length) renderResults();
    else renderTaskQuestion();
  });

  $("#restartBtn").addEventListener("click", () => {
    state.taskIndex = 0;
    state.questionIndex = 0;
    state.currentTaskAnswers = [];
    state.allAnswers = [];
    renderTaskQuestion();
  });

  $("#resetBtn").addEventListener("click", () => {
    localStorage.removeItem("thinking-map:pearl:last-session");
    state.taskIndex = 0;
    state.questionIndex = 0;
    state.currentTaskAnswers = [];
    state.allAnswers = [];
    alert("この端末に保存した因果課題の試作記録を削除しました。");
    show("intro");
  });
}

init();