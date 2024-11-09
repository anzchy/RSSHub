import { Route } from '@/types';
import { config } from '@/config';

import parseArticle from './parse-article.js';
import { getFollowingFeedQuery } from './graphql.js';
import ConfigNotFoundError from '@/errors/types/config-not-found.js';

export const route: Route = {
    path: '/following/:user',
    categories: ['blog'],
    example: '/medium/following/imsingee',
    parameters: { user: 'anzchy' },
    features: {
        requireConfig: [
            {
                name: '_ga=GA1.1.175853433.1731168916; sid=1:o6G92FNXh/c4WYPq6dmOL7ymmm3PkSQ9ycV7GHYRtDoOTz9qj+sOL8kDPegMc6Q9; uid=c36a70ea5d2e; _cfuvid=PW25G5NeQ4AYQs8vJzUbEGZVwG69oYuZUF4ehfYHKPk-1731169428055-0.0.1.1-604800000; _ga_7JY7T788PK=GS1.1.1731168916.1.1.1731169473.0.0.0; cf_clearance=z6naSvakwTeIW6lhwCNnu1aOtbsnzqIK7VQd99BqSd0-1731169474-1.2.1.1-yDW75S5gT0wh484K19vXO5YRQt8oAKe.3zrZYykw.Dfn7LG.ffif4FQlhh5Ar1iF1QHlJHVEQygbiS3C.NWJwHNOdRe2UltDZzDDrwsVpP5N_OCVG8.nLl73Mf49nqnfRVFcHnobfD4ifsS9C2ih2y_FLmSBed7_84ZdQeuZvwJwV5mEc6sNRUWyTQy8Uu1KjBZ9DA83RDtgBwEK0m5rQQFndpNUnZdWsfFd3ioiDxuxq3ZnFpPcjCMtJ6fyJzLoZj6FU_9S6HwIv7MmvpqkwyjWrG5JzoUP8f1Eda1AwGaPjXb.OC4E090MqMlvHoKp4LkTBQOgP5FXZpL_uGKsudq95kmI4M1voYCXHqvi9.JNBq87Nb_l3z965AQXB1KfMz5dJ1cNvw1Pw5Y1UpIlepxxz.ONNWPdrhpvsvXTOAA',
                description: '',
            },
        ],
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Personalized Recommendations - Following',
    maintainers: ['ImSingee'],
    handler,
    description: `:::warning
  Personalized recommendations require the cookie value after logging in, so only self-hosting is supported. See the configuration module on the deployment page for details.
  :::`,
};

async function handler(ctx) {
    const user = ctx.req.param('user');

    const cookie = config.medium.cookies[user];
    if (cookie === undefined) {
        throw new ConfigNotFoundError(`缺少 Medium 用户 ${user} 登录后的 Cookie 值`);
    }

    const posts = await getFollowingFeedQuery(user, cookie);
    ctx.set('json', posts);

    if (!posts) {
        // login failed
        throw new ConfigNotFoundError(`Medium 用户 ${user} 的 Cookie 无效或已过期`);
    }

    const urls = posts.items.map((data) => data.post.mediumUrl);

    const parsedArticles = await Promise.all(urls.map((url) => parseArticle(ctx, url)));

    return {
        title: `${user} Medium Following`,
        link: 'https://medium.com/?feed=following',
        item: parsedArticles,
    };
}
