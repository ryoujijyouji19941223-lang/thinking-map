# Changelog

## 2026-09-23 — Wave 1 six-module prototype complete

- Judea Pearl 系の因果推論モジュールを実装
- Philip Tetlock 系の確率更新モジュールを実装
- Annie Duke 系の結果バイアス / 意思決定モジュールを実装
- Wave 1 の6モジュールを一覧表示するトップページを作成
- Fact / Inference / Missing を herman.html へ移動
- 全モジュールからトップへ戻れる導線に統一
- Probability Update 用UIを追加
- 次工程をプレイテスト / デバッグに設定

## 2026-09-23 — Structural Analogy prototype

- Dedre Gentner 系の構造類推課題を実装
- オリジナル3問を追加
- 表面類似の強い誤答候補を各問題に配置
- 構造一致の選択と対応関係の自由記述を分離
- 自信度を保存
- Strategy 自己報告を保存
- 既存2モジュールとの相互リンクを追加


## 2026-09-23 — Explain Then Re-rate prototype

- Frank Keil / Leonid Rozenblit 系の「説明前→説明→説明後」課題を実装
- オリジナル3問を追加
- 事前理解度 0–100 を記録
- 自由説明と「分からなかった箇所」を保存
- 事後理解度 0–100 を記録
- rating_delta を保存
- 平均の事前/事後変化を結果表示
- Fact / Inference / Missing と相互に移動できるリンクを追加


## 2026-09-23 — first interactive prototype

- Wave 1: Fact / Inference / Missing を実装
- オリジナル問題3問を追加
- 事実 / 推測 / 不足情報を別入力欄として実装
- 自信度 0–100 を記録
- Strategy 自己報告を追加
- localStorage にセッション保存
- 試作結果画面を追加
- task.schema.json と問題データの必須項目を検証
- app.js の構文チェックを実施
- 自由文採点は暫定的な文字列一致であり、本番用ではないことを明記

## 2026-09-23 — v2/v3 integration

- Library の「思考の地図 v2.0」仕様を再確認
- v2 の A〜F 測定モデルを v3 でも維持すると決定
- v3 の11専門家領域をスコア軸ではなく Process Lens として再定義
- v2 の15課題ファミリーを全て維持
- v2→v3 対応表を追加
- 新規11課題ファミリー案を追加
- primary_construct / secondary_observation / process_lens / phase を課題メタデータへ追加する方針を決定

## 2026-09-23 — v3 planning start

- GitHub repository initialized
- v3 theoretical architecture created
- 11 cognitive-process domains defined
- separated visual imagery, spatial representation, and embodied/externalized thinking
- confidence calibration added as a cross-cutting measure
- before/after learning phases separated
- delayed retention and transfer proposed
- source map created from supplied transcripts
