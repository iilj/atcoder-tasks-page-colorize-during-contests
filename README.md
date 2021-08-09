atcoder-tasks-page-colorize-during-contests
=====

## 概要

AtCoder のコンテスト開催中に，tasks ページにおいて，提出した問題に色付けを行います．

開催中のコンテストの色付けについて，[atcoder\-tasks\-page\-colorizer](https://greasyfork.org/ja/scripts/380404-atcoder-tasks-page-colorizer) が対応していないため，これを補完します．

![Tasks Page Image](images/20210506-00.png "Tasks Page")


## 機能

- [atcoder\-tasks\-page\-colorizer](https://greasyfork.org/ja/scripts/380404-atcoder-tasks-page-colorizer) と同様の色付けを，コンテスト中にも行えるようにします．


## Greasy Fork 配布ページ

- [atcoder\-tasks\-page\-colorize\-during\-contests](https://greasyfork.org/ja/scripts/426049-atcoder-tasks-page-colorize-during-contests)


## 使用方法

Tampermonkey 等で読み込んで使用してください．


## 更新履歴

- 2021.5.6.0
  - 初版
- 2021.7.11.0
  - 順位表 JSON 取得より先に，「自分の得点状況」ページの読み込み・パースを行うよう変更
- 2021.8.0
  - 開発環境を TypeScript に移行
  - 順位表情報が提供されていない一部常設コンテストでエラーが発生しないよう処理を修正
