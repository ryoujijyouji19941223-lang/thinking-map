# 思考の地図 / Thinking Map

人が情報を受け取り、表現し、理解し、推論し、不確実性の中で判断するまでの過程を、複数の課題条件から観察するためのプロジェクトです。

## v3 の方針

v3 では「○○型の人」と一度で分類することよりも、次を重視します。

- どの条件で成績が変わるか
- 事実・解釈・自信がどう対応するか
- 新しい情報で考えを更新できるか
- その場の成績と、時間を置いた保持・転移がどう違うか
- 言語・視覚イメージ・空間表象・身体的外在化を分けて扱う
- 学習前と学習後を分け、元の傾向と訓練効果を混同しない

## v2 と v3 の関係

v3 は v2 の測定体系を捨てません。

**v2 の A〜F と Performance / Strategy / Experience**
= 「何が観察されたか」

**v3 の11理論領域**
= 「どの認知過程・研究枠組みから課題を設計したか」

この二軸で管理します。

## 11の Process Lens

1. 注意 — Amishi Jha
2. 観察 — Amy Herman
3. 空間・身体・外在化 — Barbara Tversky
4. 類推・関係構造 — Dedre Gentner
5. 理解の自己評価 — Frank Keil / Leonid Rozenblit
6. 学習・保持・検索 — Robert & Elizabeth Bjork
7. 因果推論 — Judea Pearl
8. 信念・動機づけられた推論 — Julia Galef
9. 予測・確率校正 — Philip Tetlock
10. 不確実な意思決定 — Annie Duke
11. 熟練・暗黙知・時間圧下の判断 — Gary Klein

## 重要な注意

このプロジェクトは、研究者の理論や実験を参考にした探索的な認知課題を作るものです。現時点では標準化された心理検査ではありません。

結果表示は「あなたの能力は○点」と断定せず、「この課題条件ではこの傾向が観察された」と表現します。診断・医療判断・知能判定には使用しません。

## ドキュメント

- `docs/SPEC_v2_REFERENCE.md` — v2.0で維持すべき測定仕様
- `docs/SPEC_v3.md` — v3 の全体仕様
- `docs/V2_V3_MAPPING.md` — v2 → v3 対応表
- `docs/TASK_FAMILIES_v3.md` — 既存15課題＋新規11課題案
- `docs/TEST_DESIGN.md` — 問題設計の原則
- `docs/SCORING.md` — 得点・自信・更新・保持の扱い
- `docs/SOURCE_MAP.md` — 文字起こしと理論領域の対応
- `docs/theory/` — 専門家ごとの理論メモ
- `research/transcript_notes/` — 元文字起こしから抽出した研究ノート用

## 開発順序

1. v2→v3対応を固定
2. 既存15課題の primary_construct / process_lens を定義
3. Wave 1 の新規課題を試作
4. 同一能力を複数形式で測る
5. 再テスト・遅延テスト・転移テストを追加
6. Web アプリへ実装


## 動く試作

Wave 1 の最初の3課題 **Fact / Inference / Missing**、**Explain Then Re-rate**、**Structural Analogy** を実装済みです。

構成:
- `index.html`
- `src/styles.css`
- `src/app.js`
- `data/fact_inference_missing.json`
- `keil.html`
- `src/keil.js`
- `data/explain_then_rerate.json`
- `gentner.html`
- `src/gentner.js`
- `data/structural_analogy.json`

現在は3問入り。

記録するもの:
- 事実欄
- 推測欄
- 不足情報欄
- 自信度
- 自己申告した解き方
- 参照ポイントとの簡易一致
- 完了時刻

セッション結果はブラウザの `localStorage` に保存します。

### 現在の制限

自由文の採点は、まだ簡易的な文字列一致です。
そのため、意味が同じ言い換えを正しく評価できない場合があります。
現段階では「採点器」より、入力フロー・保存形式・結果表示を一本通して検証するための試作です。


### Explain Then Re-rate

Frank Keil / Leonid Rozenblit の「説明しようとして初めて理解の空白に気づく」という発想を、オリジナル課題へ変換した試作です。

流れ:
1. 説明前の理解度を 0–100% で自己評価
2. 仕組みを最初から最後まで自由説明
3. 分からなかった箇所を自己申告
4. 説明後に理解度を再評価
5. 事前/事後の差を結果表示

現在は3問:
- ノック式ボールペン
- 電気ケトルの自動停止
- 油圧式ドアクローザー


### Structural Analogy

Dedre Gentner の Structure-Mapping の考え方を参考に、表面的な類似ではなく「関係構造の対応」を見るオリジナル課題です。

現在は3問:
- 前提条件の連鎖
- 2入力→1中継点→出力
- 循環関係

各問で:
- 構造が同じ候補を選択
- 対応関係を自由記述
- 自信度を記録
- 使った解き方を自己報告

正答だけでなく、表面類似へ引かれたか、関係構造を意識したかを別々に保存します。
