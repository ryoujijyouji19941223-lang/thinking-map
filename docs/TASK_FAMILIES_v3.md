# v3 課題ファミリー計画

## 原則

各課題には以下を持たせる。

- primary_construct: 主に採点するv2測定軸
- secondary_observation: 採点せず参考記録する要素
- process_lens: 参考にしたv3理論領域
- phase: baseline / lesson / practice / transfer / delayed
- input_modality
- difficulty parameters
- structure_fingerprint
- confidence_prompt
- strategy_prompt

## 既存15ファミリー

既存v2の15ファミリーは廃止しない。v3ではタグ付けと条件操作を追加する。

## 新規11ファミリー案

### N1 Attention Focus Shift
同一場面に対して注意指示だけを変え、後の再認・統合がどう変わるかを見る。

主:
- C3 情報統合
副:
- D1 細部保持
Lens:
- Jha

### N2 Fact / Inference / Missing
画像・文章から「見えた事実」「解釈」「不足・欠落」を別欄で答える。

主:
- C6 矛盾検出 / D6 例外検出
Lens:
- Herman

### N3 Externalization Gain
同等課題を、頭だけ / メモ / 図 / ジェスチャー可能条件で比較。

主:
- B4 空間
- B5 抽象関係
Lens:
- Tversky

### N4 Structural Analogy
表面が違うが構造が同じ問題と、表面が似て構造が違う問題を識別。

主:
- B5 抽象関係
- D4 ルール発見
Lens:
- Gentner

### N5 Explain Then Re-rate
理解度を先に自己評価し、仕組みを説明後に再評価。

主:
- F Calibration
Lens:
- Keil

### N6 Retrieval vs Restudy
一部材料は再読、一部は思い出す練習。その場と遅延後を比較。

主:
- B1/B2
- D1
Lens:
- Bjork

### N7 Intervention / Counterfactual
観察データだけの問い、介入した場合、起きなかった場合を分ける。

主:
- C1 因果推論
Lens:
- Pearl

### N8 Symmetric Evidence Evaluation
同じ証拠を、事前に与える人物評価だけ変えて評価する。

主:
- C7 仮説比較
副:
- E1 人物意図
Lens:
- Galef

### N9 Probability Update
初期確率を回答 → 証拠追加 → 再確率化。

主:
- C4 予測
- F Calibration
Lens:
- Tetlock

### N10 Outcome Blind Decision
結果を見る前に判断品質を記録し、異なる結果提示後に再評価。

主:
- C7 仮説比較
- F Calibration
Lens:
- Duke

### N11 Anomaly Under Time Pressure
短時間で場面を把握し、「何が普通と違うか」「次に何をするか」を回答。

主:
- C6 矛盾検出
- D6 例外検出
Lens:
- Klein

## 採点事故を防ぐ

1つの課題で primary_construct は原則1〜2個まで。
Strategy / Experience は能力点へ直接加算しない。
process_lens は得点軸ではない。

例:
N3で図を描いた条件の成績が上がっても、
「Tversky能力 +20」
のような採点はしない。

記録するのは、
「図を使える条件で空間関係再構成が改善した」
という条件差。
