import { Score } from '../interfaces/Standings';

export const getCurrentScores = async (contestSlug: string): Promise<Map<string, [Score, string]>> => {
    const problemId2Info: Map<string, [Score, string]> = new Map<string, [Score, string]>();
    const res: Response = await fetch(`https://atcoder.jp/contests/${contestSlug}/score`);
    const scoreHtml: string = await res.text();
    const parser = new DOMParser();
    const doc: Document = parser.parseFromString(scoreHtml, 'text/html');
    doc.querySelectorAll<HTMLTableRowElement>('#main-div tbody tr').forEach((tableRow: HTMLTableRowElement) => {
        const anchor1: HTMLAnchorElement | null = tableRow.querySelector<HTMLAnchorElement>('td:nth-child(1) a');
        if (anchor1 === null) throw new Error('問題リンクが見つかりませんでした');
        const problemId: string | undefined = anchor1.href.split('/').pop();
        if (problemId === undefined) throw new Error('問題IDが見つかりませんでした');

        const td3: HTMLTableCellElement | null = tableRow.querySelector<HTMLTableCellElement>('td:nth-child(3)');
        if (td3 === null || td3.textContent === null) throw new Error('スコアが不明な行があります');
        const score = Number(td3.textContent);

        const td4: HTMLTableCellElement | null = tableRow.querySelector<HTMLTableCellElement>('td:nth-child(4)');
        if (td4 === null || td4.textContent === null) throw new Error('提出日時が不明な行があります');
        const datetimeString = td4.textContent;

        // console.log(problemId, score, datetimeString);
        problemId2Info.set(problemId, [score, datetimeString]);
    });
    return problemId2Info;
};
