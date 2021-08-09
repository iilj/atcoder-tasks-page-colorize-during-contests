import moment = require('moment');
import { Score, Standings, StandingsEntry, TaskResultEntry } from '../interfaces/Standings';
import { fetchContestStandings } from './APIClient';
import { getCurrentScores } from './DOMParseUtil';

export class TaskListManager {
    mainContainer: HTMLElement;
    contestSlug: string;
    rows: [string, HTMLTableRowElement, HTMLTableDataCellElement, HTMLTableDataCellElement][];
    problemId2Info: Map<string, [Score, string]> | undefined;

    constructor(mainContainer: HTMLElement, contestSlug: string) {
        this.mainContainer = mainContainer;
        this.contestSlug = contestSlug;

        // ヘッダ挿入
        const headInsertPt: HTMLTableCellElement | null =
            mainContainer.querySelector<HTMLTableCellElement>('thead th:last-child');
        if (headInsertPt === null) throw new Error('ヘッダ挿入ポイントが見つかりませんでした');
        headInsertPt.insertAdjacentHTML(
            'beforebegin',
            '<th width="10%" class="text-center">得点</th><th class="text-center">提出日時</th>'
        );

        // 問題一覧テーブルから，行・セル・問題IDを取り出してリストに収める
        this.rows = [];
        const rowElementss = this.mainContainer.querySelectorAll<HTMLTableRowElement>('#main-div tbody tr');
        rowElementss.forEach((rowElement: HTMLTableRowElement) => {
            const anchor2: HTMLAnchorElement | null = rowElement.querySelector<HTMLAnchorElement>('td:nth-child(2) a');
            if (anchor2 === null) throw new Error('問題リンクが見つかりませんでした');
            const problemId: string | undefined = anchor2.href.split('/').pop();
            if (problemId === undefined) throw new Error('問題IDが見つかりませんでした');

            const tdInsertPt: HTMLTableCellElement | null =
                rowElement.querySelector<HTMLTableCellElement>('td:last-child');
            if (tdInsertPt === null) throw new Error('td が見つかりませんでした');

            const scoreCell: HTMLTableDataCellElement = document.createElement('td');
            const datetimeCell: HTMLTableDataCellElement = document.createElement('td');
            scoreCell.classList.add('text-center');
            datetimeCell.classList.add('text-center');
            tdInsertPt.insertAdjacentElement('beforebegin', scoreCell);
            tdInsertPt.insertAdjacentElement('beforebegin', datetimeCell);

            scoreCell.textContent = '-';
            datetimeCell.textContent = '-';

            this.rows.push([problemId, rowElement, scoreCell, datetimeCell]);
        });
    }

    /** 「自分の得点状況」ページの情報からテーブルを更新する */
    async updateByScorePage(): Promise<void> {
        this.problemId2Info = await getCurrentScores(this.contestSlug);
        this.rows.forEach(([problemId, rowElement, scoreCell, datetimeCell]): void => {
            if (this.problemId2Info === undefined) return;

            if (this.problemId2Info.has(problemId)) {
                const [score, datetimeString]: [Score, string] = this.problemId2Info.get(problemId) as [Score, string];
                scoreCell.textContent = `${score}`;
                datetimeCell.textContent = datetimeString;
                if (datetimeString !== '-') {
                    rowElement.classList.add(score > 0 ? 'success' : 'danger');
                }
            } else {
                throw new Error(`スコア情報がありません：${problemId}`);
            }
        });
    }

    /** 順位表情報からテーブルを更新する */
    async updateByStandings(): Promise<void> {
        // 一部常設コンテストは順位表情報が提供されておらず 404 が返ってくる
        let standings: Standings;
        try {
            standings = await fetchContestStandings(this.contestSlug);
        } catch {
            console.warn('atcoder-tasks-page-colorize-during-contests: このコンテストは順位表が提供されていません');
            return;
        }

        const userStandingsEntry: StandingsEntry | undefined = standings.StandingsData.find(
            (_standingsEntry: StandingsEntry): boolean => _standingsEntry.UserScreenName == userScreenName
        );
        if (userStandingsEntry === undefined) return;

        this.rows.forEach(([problemId, rowElement, scoreCell, datetimeCell]): void => {
            if (!(problemId in userStandingsEntry.TaskResults)) return;

            const taskResultEntry: TaskResultEntry = userStandingsEntry.TaskResults[problemId];
            const dt: moment.Moment = startTime.clone().add(taskResultEntry.Elapsed / 1000000000, 's');
            // console.log(dt.format());

            if (this.problemId2Info === undefined) throw new Error('先に updateByScorePage() を呼んでください');
            const [score] = this.problemId2Info.get(problemId) as [Score, string];
            const scoreFromStandings = taskResultEntry.Score / 100;
            if (scoreFromStandings >= score) {
                scoreCell.textContent = `${scoreFromStandings}`;
                datetimeCell.textContent = `${dt.format('YYYY/MM/DD HH:mm:ss')}`;
            }
            if (taskResultEntry.Status === 1) {
                if (rowElement.classList.contains('danger')) rowElement.classList.remove('danger');
                rowElement.classList.add('success');
            } else {
                if (rowElement.classList.contains('success')) rowElement.classList.remove('success');
                rowElement.classList.add('danger');
            }
        });
    }
}
