// ==UserScript==
// @name         atcoder-tasks-page-colorize-during-contests
// @namespace    iilj
// @version      2021.7.11.0
// @description  tasks ページにおいて，提出した問題に色付けを行います．開催中のコンテストの色付けについて，atcoder-tasks-page-colorizer が対応していないため，これを補完します．
// @author       iilj
// @supportURL   https://github.com/iilj/atcoder-tasks-page-colorize-during-contests/issues
// @match        https://atcoder.jp/contests/*/tasks
// ==/UserScript==

/**
 * 問題ごとの結果エントリ
 * @typedef {Object} TaskResultEntry
 * @property {any} Additional 謎
 * @property {number} Count 提出回数
 * @property {number} Elapsed コンテスト開始からの経過時間 [ns].
 * @property {number} Failure 非 AC の提出数（ACするまではペナルティではない）．
 * @property {boolean} Frozen アカウントが凍結済みかどうか？
 * @property {number} Penalty ペナルティ数
 * @property {boolean} Pending ジャッジ中かどうか？
 * @property {number} Score 得点（×100）
 * @property {number} Status 1 のとき満点？ 6 のとき部分点？
 */

/**
 * 全問題の結果
 * @typedef {Object} TotalResultEntry
 * @property {number} Accepted 正解した問題数
 * @property {any} Additional 謎
 * @property {number} Count 提出回数
 * @property {number} Elapsed コンテスト開始からの経過時間 [ns].
 * @property {boolean} Frozen アカウントが凍結済みかどうか？
 * @property {number} Penalty ペナルティ数
 * @property {number} Score 得点（×100）
 */

/**
 * 順位表エントリ
 * @typedef {Object} StandingsEntry
 * @property {any} Additional 謎
 * @property {string} Affiliation 所属．IsTeam = true のときは，チームメンバを「, 」で結合した文字列．
 * @property {number} AtCoderRank AtCoder 内順位
 * @property {number} Competitions Rated コンテスト参加回数
 * @property {string} Country 国ラベル．"JP" など．
 * @property {string} DisplayName 表示名．"hitonanode" など．
 * @property {number} EntireRank コンテスト順位？
 * @property {boolean} IsRated Rated かどうか
 * @property {boolean} IsTeam チームかどうか
 * @property {number} OldRating コンテスト前のレーティング．コンテスト後のみ有効．
 * @property {number} Rank コンテスト順位？
 * @property {number} Rating コンテスト後のレーティング
 * @property {{[key: string]: TaskResultEntry}} TaskResults 問題ごとの結果．参加登録していない人は空．
 * @property {TotalResultEntry} TotalResult 全体の結果
 * @property {boolean} UserIsDeleted ユーザアカウントが削除済みかどうか
 * @property {string} UserName ユーザ名．"hitonanode" など．
 * @property {string} UserScreenName ユーザの表示名．"hitonanode" など．
 */

/**
 * 問題エントリ
 * @typedef {Object} TaskInfoEntry
 * @property {string} Assignment 問題ラベル．"A" など．
 * @property {string} TaskName 問題名．
 * @property {string} TaskScreenName 問題の slug. "abc185_a" など．
 */

/**
 * 順位表情報
 * @typedef {Object} Standings
 * @property {any} AdditionalColumns 謎
 * @property {boolean} Fixed 謎
 * @property {StandingsEntry[]} StandingsData 順位表データ
 * @property {TaskInfoEntry[]} TaskInfo 問題データ
 */

/* globals $, contestScreenName, startTime, endTime, userScreenName, moment */

(async () => {
    'use strict';

    // 終了後のコンテストに対する処理は以下のスクリプトに譲る：
    // https://greasyfork.org/ja/scripts/380404-atcoder-tasks-page-colorizer
    if (moment() >= endTime) return;

    /** @type {Map<string, [number, string]>} */
    const problemId2Info = new Map();
    // 自分の得点状況の取得
    {
        const res = await fetch(`https://atcoder.jp/contests/${contestScreenName}/score`);
        const scoreHtml = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(scoreHtml, 'text/html');
        doc.querySelectorAll('#main-div tbody tr').forEach((tableRow, key) => {
            const problemId = tableRow.querySelector('td:nth-child(1) a').getAttribute('href').split('/').pop();
            const score = Number(tableRow.querySelector('td:nth-child(3)').textContent);
            const datetimeString = tableRow.querySelector('td:nth-child(4)').textContent;
            // console.log(problemId, score, datetimeString);
            problemId2Info.set(problemId, [score, datetimeString]);
        });
    }

    // テーブルの更新
    {
        document.querySelector('#main-div thead th:last-child').insertAdjacentHTML(
            'beforebegin', '<th width="10%" class="text-center">得点</th><th class="text-center">提出日時</th>');
        document.querySelectorAll('#main-div tbody tr').forEach((tableRow, key) => {
            const problemId = tableRow.querySelector('td:nth-child(2) a').getAttribute('href').split('/').pop();
            const scoreCellId = `score-cell-${problemId}`;
            const datetimeCellId = `datetime-cell-${problemId}`;
            if (problemId2Info.has(problemId)) {
                const [score, datetimeString] = problemId2Info.get(problemId);
                tableRow.querySelector('td:last-child').insertAdjacentHTML(
                    'beforebegin',
                    `<td class="text-center" id="${scoreCellId}">${score}</td>
                    <td class="text-center" id="${datetimeCellId}">${datetimeString}</td>`);
                if (datetimeString !== '-') {
                    tableRow.classList.add(score > 0 ? 'success' : 'danger');
                }
            } else {
                // ここに来ることは本来はないはず（未提出の問題だと [0, '-'] のはず）
                tableRow.querySelector('td:last-child').insertAdjacentHTML(
                    'beforebegin',
                    `<td class="text-center" id="${scoreCellId}">-</td>
                    <td class="text-center" id="${datetimeCellId}">-</td>`);
            }
        });
    }

    const res = await fetch(`https://atcoder.jp/contests/${contestScreenName}/standings/json`);
    /** @type {Standings} */
    const standings = await res.json();

    const standingsEntry = standings.StandingsData.find((_standingsEntry) => _standingsEntry.UserScreenName == userScreenName);

    document.querySelectorAll('#main-div tbody tr').forEach((tableRow, key) => {
        const problemId = tableRow.querySelector('td:nth-child(2) a').getAttribute('href').split('/').pop();
        const scoreCellId = `score-cell-${problemId}`;
        const datetimeCellId = `datetime-cell-${problemId}`;
        if (standingsEntry !== undefined && problemId in standingsEntry.TaskResults) {
            const taskResultEntry = standingsEntry.TaskResults[problemId];
            const dt = startTime.clone().add(taskResultEntry.Elapsed / 1000000000, 's');
            // console.log(dt.format());

            const [score, datetimeString] = problemId2Info.get(problemId);
            const scoreFromStandings = taskResultEntry.Score / 100;
            if (scoreFromStandings >= score) {
                tableRow.querySelector(`#${scoreCellId}`).textContent = `${scoreFromStandings}`;
                tableRow.querySelector(`#${datetimeCellId}`).textContent = `${dt.format("YYYY/MM/DD HH:mm:ss")}`;
            }
            if (taskResultEntry.Status === 1) {
                if (tableRow.classList.contains('danger')) tableRow.classList.remove('danger');
                tableRow.classList.add('success');
            } else {
                if (tableRow.classList.contains('success')) tableRow.classList.remove('success');
                tableRow.classList.add('danger');
            }
        }
    });
})();
