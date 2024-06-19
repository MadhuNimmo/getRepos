const fs = require('fs');
const axios = require('axios');

const username = process.env.GITHUB_USERNAME;
const token = process.env.GITHUB_TOKEN;

async function getTopNodeJSProjects() {
  try {
    const perPage = 100;
    let page = 1;
    let totalProjects = [];

    // Date representing January 1, 2023
    const januaryFirst2023 = new Date('2023-01-01');

    // Fetch projects in pages until we have at least 100 projects
    while (totalProjects.length < 100) {
      // Get trending Node.js repositories using the GitHub search API
      const response = await axios.get('https://api.github.com/search/repositories', {
        params: {
          q: 'language:javascript topic:nodejs',
          sort: 'stars',
          order: 'desc',
          per_page: perPage,
          page,
        },
        auth: {
          username,
          password: token,
        },
      });
      //response.data.items.map(repo => (console.log(repo)));
      // Get only the necessary information for each repository and filter based on the last commit information
      const filteredRepos = await Promise.all(response.data.items.map(async (repo) => {
        const lastCommitData = await getLastCommit(username, repo.full_name);
        if (!repo.archived && lastCommitData!==null && new Date(lastCommitData.commitDate) >= januaryFirst2023) {
          return {
            full_name: repo.full_name,
            html_url: repo.html_url,
            created_at: repo.created_at,
            git_url: repo.git_url,
            size: repo.size,
            stargazers_count: repo.stargazers_count,
            watchers_count: repo.watchers_count,
            forks_count: repo.forks_count,
            last_commit: lastCommitData.commitSha,
            last_commit_date: lastCommitData.commitDate,
          };
        }else{
          return null
        }
      }));
      // Filter out null values
      const validFilteredRepos = filteredRepos.filter(repo => repo !== null);
      console.log("filteredRepos:", validFilteredRepos.length);
      // Get information about test suites and coverage for each repository
      const reposWithTestsAndCoverage = await Promise.all(
        validFilteredRepos.map(async repo => {
          try {
            const testsAndCoverage = await getTestsAndCoverage(username, repo.full_name);
            return { ...repo, testsAndCoverage };
          } catch (error) {
            console.error(`Error fetching tests and coverage for ${repo.full_name}:`, error.message);
            return null; // Return null for failed requests
          }
        })
      );
      console.log("reposWithTestsAndCoverage:",reposWithTestsAndCoverage.length)
      // Filter out repositories where tests could not be determined or don't have a test suite
      const filteredWithTests = reposWithTestsAndCoverage.filter(repo => repo && repo.testsAndCoverage && repo.testsAndCoverage.hasTestSuite);
      console.log("filteredWithTests:", filteredWithTests.length);

      // Add the filtered projects to the total list
      totalProjects = totalProjects.concat(filteredWithTests);

      // Move to the next page for the next iteration
      page++;
    }

    console.log("totalProjects:", totalProjects.length);

    // Write the top 100 Node.js repositories with tests and coverage to a JSON file
    fs.writeFileSync('topNodeJSProjects.json', JSON.stringify(totalProjects.slice(0, 100), null, 2));

    console.log('Data has been written to topNodeJSProjects.json');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function getTestsAndCoverage(username, repoFullName) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${repoFullName}/contents/package.json`, {
      auth: {
        username,
        password: token,
      },
    });

    const packageJsonContent = Buffer.from(response.data.content, 'base64').toString();
    const packageJson = JSON.parse(packageJsonContent);

    // Check if the package.json file contains a "scripts" object and if it has a "test" script defined
    const hasTestScript = packageJson && packageJson.scripts && packageJson.scripts.test &&
      packageJson.scripts.test !== 'echo "Test will be implemented." && exit 0' &&
      packageJson.scripts.test !== 'echo "Error: no test specified" && exit 1';

    return {
      hasTestSuite: !!hasTestScript,
    };
  } catch (error) {
    console.error(`Error fetching package.json information for ${repoFullName}:`, error.message);
    throw new Error(`Failed to fetch package.json information for ${repoFullName}`);
  }
}

async function getDefaultBranch(username, repoFullName) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${repoFullName}`, {
      auth: {
        username,
        password: token,
      },
    });
    return response.data.default_branch;
  } catch (error) {
    console.error(`Error fetching default branch for ${repoFullName}:`, error.message);
    throw new Error(`Failed to fetch default branch for ${repoFullName}`);
  }
}

async function getLastCommit(username, repoFullName) {
  try {
    const defaultBranch = await getDefaultBranch(username, repoFullName);
    const response = await axios.get(`https://api.github.com/repos/${repoFullName}/commits/${defaultBranch}`, {
      auth: {
        username,
        password: token,
      },
    });
    
    // Extract the SHA and commit date
    const commitSha = response.data.sha;
    const commitDate = response.data.commit.committer.date;
    return { commitSha, commitDate };
  } catch (error) {
    console.error(`Error fetching last commit information for ${repoFullName}:`, error.message);
    return null;
  }
}

// Run the script
getTopNodeJSProjects();