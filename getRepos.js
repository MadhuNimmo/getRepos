import { Octokit } from '@octokit/rest';
import { throttling } from '@octokit/plugin-throttling';
import fs from 'fs/promises';

const MyOctokit = Octokit.plugin(throttling);

const octokit = new MyOctokit({
  auth: process.env.GITHUB_TOKEN,
  throttle: {
    onRateLimit: (retryAfter, options, octokit, retryCount) => {
      console.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
      if (retryCount < 5) {
        console.log(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
    },
    onSecondaryRateLimit: (retryAfter, options, octokit) => {
      console.warn(`Secondary rate limit hit for request ${options.method} ${options.url}`);
      return true;
    },
  },
});

async function getLatestCommitSHA(repoFullName) {
  try {
    const { data } = await octokit.repos.listCommits({
      owner: repoFullName.split('/')[0],
      repo: repoFullName.split('/')[1],
      per_page: 1,
    });
    return data[0].sha;
  } catch (error) {
    console.error(`Error fetching commit for ${repoFullName}:`, error.message);
    return null;
  }
}

async function getTopNodeJSProjects(count = 100) {
  const perPage = 100;
  let page = 1;
  let allRepos = [];

  while (allRepos.length < count) {
    try {
      const { data } = await octokit.search.repos({
        q: 'language:javascript topic:nodejs',
        sort: 'stars',
        order: 'desc',
        per_page: perPage,
        page,
      });

      const filteredRepos = data.items.filter(repo => 
        !repo.archived && new Date(repo.pushed_at) >= new Date('2023-01-01')
      ).map(repo => ({
        full_name: repo.full_name,
        html_url: repo.html_url,
        created_at: repo.created_at,
        pushed_at: repo.pushed_at,
        size: repo.size,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
      }));

      for (const repo of filteredRepos) {
        const latestCommitSHA = await getLatestCommitSHA(repo.full_name);
        repo.commit_sha = latestCommitSHA;
      }

      allRepos = allRepos.concat(filteredRepos);
      page++;

      if (data.items.length < perPage) break;
    } catch (error) {
      console.error('Error fetching repos:', error.message);
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 1 minute before retrying
    }
  }

  return allRepos.slice(0, count);
}

async function main() {
  try {
    const topProjects = await getTopNodeJSProjects();
    await fs.writeFile('topNodeJSProjects.json', JSON.stringify(topProjects, null, 2));
    console.log('Data has been written to topNodeJSProjects.json');

    const npmFilterInput = topProjects.map(project => `${project.html_url}#${project.commit_sha}`).join('\n');
    await fs.writeFile('benchmark_repos.txt', npmFilterInput);
    console.log('benchmark_repos.txt has been created for npm-filter input');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
