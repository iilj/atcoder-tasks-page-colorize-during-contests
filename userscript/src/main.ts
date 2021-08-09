import moment = require('moment');
import { TaskListManager } from './utils/TaskListManager';

void (async () => {
    // 終了後のコンテストに対する処理は以下のスクリプトに譲る：
    // https://greasyfork.org/ja/scripts/380404-atcoder-tasks-page-colorizer
    if (moment() >= endTime) return;

    const mainContainer: HTMLElement | null = document.getElementById('main-container');
    if (mainContainer === null) throw new Error('メインコンテナが見つかりませんでした');

    const taskListManager = new TaskListManager(mainContainer, contestScreenName);

    await taskListManager.updateByScorePage();
    console.log('atcoder-tasks-page-colorize-during-contests: updateByScorePage() ended');

    await taskListManager.updateByStandings();
    console.log('atcoder-tasks-page-colorize-during-contests: updateByStandings() ended');
})();
