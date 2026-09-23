const $ = (sel) => document.querySelector(sel);

const state = {
  tasks: [],
  index: 0,
  answers: [],
  current: null
};

function show(id) {
  ["intro", "preRateView", "explainView", "postRateView", "reviewView", "resultView"].forEach((x) => {
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

function renderProgress() {
  const current = state.index + 1;
  $("#progressText").textContent = `${current} / ${state.tasks.length}`;
  $("#progressBar").style.width = `${(current / state.tasks.length) * 100}%`;
}

function renderPreRate() {
  const task = state.tasks[state.index];
  state.current = {
    task_id: task.id,
    family: task.family,
    primary_construct: task.primary_construct,
    process_lens: task.process_lens,
    phase: task.phase,
    pre_rating: 50,
    explanation: "",
    unclear: "",
    post_rating: 50,
    why_changed: "",
    started_at: new Date().toISOString()
  };

  renderProgress();
  $("#taskId").textContent = task.id;
  $("#topicTitle").textContent = task.prompt.title;
  $("#question").textContent = task.prompt.question;
  $("#preRating").value = 50;
  $("#preRatingValue").textContent = "50";
  show("preRateView");
}

function renderExplain() {
  const task = state.tasks[state.index];
  $("#explainTaskId").textContent = task.id;
  $("#explainTitle").textContent = task.prompt.title;
  $("#explainQuestion").textContent = task.prompt.question;
  $("#instruction").textContent = task.prompt.instruction;
  $("#explanation").value = "";
  $("#unclear").value = "";
  show("explainView");
  $("#explanation").focus();
}

function renderPostRate() {
  $("#postRating").value = state.current.pre_rating;
  $("#postRatingValue").textContent = String(state.current.pre_rating);
  $("#whyChanged").value = "";
  show("postRateView");
}

function makeReferenceHtml(task) {
  return `<ul>${task.prompt.reference_concepts.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
}

function renderReview() {
  const task = state.tasks[state.index];
  const a = state.current;
  const delta = a.post_rating - a.pre_rating;
  const deltaText = delta === 0 ? "変化なし" : `${delta > 0 ? "+" : ""}${delta}ポイント`;

  $("#reviewTitle").textContent = task.prompt.title;
  $("#ratingDelta").innerHTML = `
    <p><strong>説明前:</strong> ${a.pre_rating}%</p>
    <p><strong>説明後:</strong> ${a.post_rating}%</p>
    <p><strong>変化:</strong> ${deltaText}</p>
    <p class="muted">この差は良し悪しではなく、自己評価が説明によってどう動いたかの記録です。</p>
  `;
  $("#reviewExplanation").textContent = a.explanation;
  $("#reviewUnclear").textContent = a.unclear || "（特に記入なし）";
  $("#referenceConcepts").innerHTML = makeReferenceHtml(task);
  $("#taskNote").textContent = task.prompt.note;
  show("reviewView");
}

function saveSession() {
  const payload = {
    version: "v3-wave1-keil-prototype",
    completed_at: new Date().toISOString(),
    family: "explain_then_rerate",
    answers: state.answers
  };
  localStorage.setItem("thinking-map:keil:last-session", JSON.stringify(payload));
}

function renderResults() {
  saveSession();

  const n = state.answers.length;
  const avgPre = Math.round(state.answers.reduce((s, a) => s + a.pre_rating, 0) / Math.max(n, 1));
  const avgPost = Math.round(state.answers.reduce((s, a) => s + a.post_rating, 0) / Math.max(n, 1));
  const avgDelta = Math.round(
    state.answers.reduce((s, a) => s + (a.post_rating - a.pre_rating), 0) / Math.max(n, 1)
  );
  const noticedGap = state.answers.filter((a) => a.unclear.trim().length > 0).length;

  const interpretation = avgDelta < 0
    ? "説明した後に自己評価が下がりました。説明しようとしたことで、理解の空白を見つけた可能性があります。"
    : avgDelta > 0
      ? "説明した後に自己評価が上がりました。説明を組み立てることで、自分が理解している部分を確認できた可能性があります。"
      : "説明前後の平均自己評価は変わりませんでした。個別課題での変化も併せて見ます。";

  $("#summary").innerHTML = `
    <p><strong>回答した課題:</strong> ${n}問</p>
    <p><strong>説明前の平均理解度:</strong> ${avgPre}%</p>
    <p><strong>説明後の平均理解度:</strong> ${avgPost}%</p>
    <p><strong>平均変化:</strong> ${avgDelta > 0 ? "+" : ""}${avgDelta}ポイント</p>
    <p><strong>説明中に不明点を自分で記録した課題:</strong> ${noticedGap} / ${n}</p>
    <p>${interpretation}</p>
  `;

  $("#taskBreakdown").innerHTML = state.answers.map((a, idx) => {
    const delta = a.post_rating - a.pre_rating;
    return `
      <div class="result-row">
        <strong>${idx + 1}. ${escapeHtml(a.title)}</strong>
        <div>説明前 ${a.pre_rating}% → 説明後 ${a.post_rating}%（${delta > 0 ? "+" : ""}${delta}）</div>
        <div class="muted">不明点: ${escapeHtml(a.unclear || "記入なし")}</div>
      </div>
    `;
  }).join("");

  show("resultView");
}

async function init() {
  try {
    const res = await fetch("./data/explain_then_rerate.json");
    if (!res.ok) throw new Error("task load failed");
    state.tasks = await res.json();
  } catch (err) {
    $("#intro").innerHTML = `
      <h2>読み込みエラー</h2>
      <p>問題データを読み込めませんでした。簡易HTTPサーバーまたは公開ページから開いてください。</p>
    `;
    return;
  }

  $("#preRating").addEventListener("input", (e) => {
    $("#preRatingValue").textContent = e.target.value;
  });

  $("#postRating").addEventListener("input", (e) => {
    $("#postRatingValue").textContent = e.target.value;
  });

  $("#startBtn").addEventListener("click", () => {
    state.index = 0;
    state.answers = [];
    renderPreRate();
  });

  $("#toExplainBtn").addEventListener("click", () => {
    state.current.pre_rating = Number($("#preRating").value);
    renderExplain();
  });

  $("#toPostRateBtn").addEventListener("click", () => {
    const explanation = $("#explanation").value.trim();
    if (!explanation) {
      alert("分かる範囲で構わないので、仕組みの説明を書いてください。");
      return;
    }
    state.current.explanation = explanation;
    state.current.unclear = $("#unclear").value.trim();
    renderPostRate();
  });

  $("#submitBtn").addEventListener("click", () => {
    const task = state.tasks[state.index];
    state.current.post_rating = Number($("#postRating").value);
    state.current.why_changed = $("#whyChanged").value.trim();
    state.current.rating_delta = state.current.post_rating - state.current.pre_rating;
    state.current.completed_at = new Date().toISOString();
    state.current.title = task.prompt.title;
    renderReview();
  });

  $("#nextBtn").addEventListener("click", () => {
    state.answers.push(state.current);
    state.current = null;
    state.index += 1;
    if (state.index >= state.tasks.length) renderResults();
    else renderPreRate();
  });

  $("#restartBtn").addEventListener("click", () => {
    state.index = 0;
    state.answers = [];
    renderPreRate();
  });

  $("#resetBtn").addEventListener("click", () => {
    localStorage.removeItem("thinking-map:keil:last-session");
    state.index = 0;
    state.answers = [];
    state.current = null;
    alert("この端末に保存した Explain Then Re-rate の試作記録を削除しました。");
    show("intro");
  });
}

init();