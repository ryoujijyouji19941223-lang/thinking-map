# 思考の地図 / Thinking Map

人が情報を受け取り、表現し、理解し、推論し、不確実性の中で判断するまでの過程を、複数の課題条件から観察するプロジェクトです。

## v2 と v3

- v2 の A〜F と Performance / Strategy / Experience = 何が観察されたか
- v3 の専門家由来 Process Lens = どの認知過程を狙って課題を設計したか

Process Lens 自体を「能力点」にはしません。

## Wave 1 実装済み

トップページ `index.html` から6モジュールへ移動できます。

1. `herman.html` — Fact / Inference / Missing
2. `keil.html` — Explain Then Re-rate
3. `gentner.html` — Structural Analogy
4. `pearl.html` — Observation / Intervention / Counterfactual
5. `tetlock.html` — Probability Update
6. `duke.html` — Outcome Blind Decision

各モジュールは原則3問入りで、結果はブラウザの `localStorage` にモジュール別で保存します。

## 重要な注意

これは研究者の理論や実験を参考にした探索的な認知課題です。標準化された心理検査ではありません。
診断・知能判定・固定的な「思考タイプ」分類には使用しません。

## 主なドキュメント

- `docs/SPEC_v2_REFERENCE.md`
- `docs/SPEC_v3.md`
- `docs/V2_V3_MAPPING.md`
- `docs/TASK_FAMILIES_v3.md`
- `docs/WAVE1_SPEC.md`
- `docs/TEST_DESIGN.md`
- `docs/SCORING.md`
- `docs/SOURCE_MAP.md`
- `docs/theory/`
- `schemas/task.schema.json`

## 現時点の既知の制限

- 自由文の意味採点は未完成
- 各モジュール3問程度で、安定した個人差推定には少ない
- 遅延テストと転移テストは未実装
- 端末差・順序効果・練習効果の検証はこれから
- Wave 1 はUIと記録フローを通す試作段階

次工程は6モジュールを実際にプレイし、問題文・難易度・誘導・採点・結果表示・操作性をデバッグします。
