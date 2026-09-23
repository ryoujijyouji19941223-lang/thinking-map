# Wave 1 実装仕様

目的: v2 の既存構造を壊さず、v3 の新しい考え方を最小UI変更で試す。

## 共通フロー

1. 課題提示
2. 回答
3. 自信度 0–100
4. 必要な課題のみ Strategy / Experience 確認
5. 条件に応じて追加情報
6. 再回答 / 再自信
7. 記録

Process Lens は画面上の得点として見せない。

---

## W1-1 Fact / Inference / Missing

### 目的
観察した事実、そこからの解釈、欠落・不足情報を分けられるかを見る。

### v2との対応
- C6 矛盾検出
- D6 例外検出
- B6 状況モデル

### Lens
Amy Herman

### UI
同じ場面について3欄を順番に出す。

1. 実際に見える / 書かれている事実
2. そこから考えたこと
3. 分からないこと・本来ありそうだが無いもの

### 採点
- 事実欄に推測を書いた割合
- 正しい事実の回収
- 欠落情報の発見
- 自信度

「解釈の面白さ」は正答点にしない。

---

## W1-2 Explain Then Re-rate

### 目的
「分かっている感覚」と、実際に仕組みを説明できる程度の差を見る。

### v2との対応
- F1 Calibration Bias
- F2 Calibration Accuracy
- B2 意味・概念表象

### Lens
Frank Keil / Leonid Rozenblit

### UI
1. 「この仕組みをどれくらい理解していますか」0–100
2. 最初から最後まで自由説明
3. 「説明できなかった箇所は？」任意
4. 理解度を再度0–100

### 保存
- pre_rating
- explanation
- post_rating
- rating_delta
- rubric_score

---

## W1-3 Structural Analogy

### 目的
見た目ではなく関係構造を対応付けられるかを見る。

### v2との対応
- B5 抽象関係表象
- C5 比較
- D4 ルール発見

### Lens
Dedre Gentner

### 問題構成
候補:
- A: 表面も構造も似る
- B: 表面は違うが構造が同じ
- C: 表面は似るが構造が違う

Bを見抜ける問題を必ず含む。

### 追加回答
「何と何が対応しているか」を説明させる。

---

## W1-4 Intervention / Counterfactual

### 目的
観察された関連、介入、反実仮想を区別する。

### v2との対応
- C1 因果推論
- C7 仮説比較

### Lens
Judea Pearl

### UI例
同じ状況から三種類の質問を出す。

- 観察: Xの人ほどYだった。何が言える？
- 介入: Xを強制的に変えたらYはどうなると考える？
- 反実仮想: この人にXが無かったらどうなっていた？

### 注意
数式知識は要求しない。
相関だけから介入効果を断定する回答を区別する。

---

## W1-5 Probability Update

### 目的
不確実な仮説を数値として表し、新情報で更新できるかを見る。

### v2との対応
- C4 予測
- C7 仮説比較
- F1/F2/F3 メタ認知

### Lens
Philip Tetlock

### UI
1. 仮説A/B/Cを提示
2. 合計100%になるよう確率を配分
3. 新証拠を提示
4. 再配分
5. 変更理由

### 指標
- update_magnitude
- evidence_direction_match
- confidence
- probability_sum_valid

---

## W1-6 Outcome Blind Decision

### 目的
結果を知ったことによって、過去の判断品質評価が変わる程度を見る。

### v2との対応
- C7 仮説比較
- C4 予測
- F メタ認知

### Lens
Annie Duke

### UI
1. 判断時に利用可能だった情報だけ提示
2. 選択と理由
3. 「この判断はどのくらい良い判断？」0–100
4. 成功または失敗の結果を提示
5. 判断品質を再評価

### 実験条件
同じ判断過程に対し、問題セット間で異なる結果を割り当てられる設計にする。

### 指標
- pre_quality_rating
- post_quality_rating
- result_shift
- reason_shift

## Wave 1 完成条件

- 6ファミリーすべてに最低3テンプレート構造
- 同じ文章の再利用なし
- structure_fingerprint が機能
- confidence を保存
- primary_construct は1〜2個
- Strategy / Experience を直接能力点にしない
- 少なくとも各ファミリー1つは自由回答を含む
- 既存v2課題を壊さず並存可能
