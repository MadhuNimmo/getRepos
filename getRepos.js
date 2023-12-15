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

      // Get only the necessary information for each repository and filter based on the last commit information
      const filteredRepos = await Promise.all(response.data.items.map(async repo => {
        const lastUpdate = new Date(repo.updated_at);
        // Get the last commit information
        const lastCommit = await getLastCommit(username, repo.full_name);
        if (repo.lastCommit !== null && lastUpdate >= januaryFirst2023) {
          return {
            full_name: repo.full_name,
            html_url: repo.html_url,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            git_url: repo.git_url,
            size: repo.size,
            stargazers_count: repo.stargazers_count,
            watchers_count: repo.watchers_count,
            forks_count: repo.forks_count,
            last_commit: lastCommit,
          };
        }
      }));

      // Filter out projects with a null last commit ID
      const filteredWithValidCommit = filteredRepos.filter(repo => repo.last_commit !== null);

      // Get information about test suites and coverage for each repository
      const reposWithTestsAndCoverage = await Promise.all(
        filteredWithValidCommit.map(async repo => {
          const testsAndCoverage = await getTestsAndCoverage(username, repo.full_name);
          return { ...repo, testsAndCoverage };
        })
      );

      // Filter the repositories with a test suite
      const filteredWithTests = reposWithTestsAndCoverage.filter(repo => repo.testsAndCoverage.hasTestSuite);

      // Add the filtered projects to the total list
      totalProjects = totalProjects.concat(filteredWithTests);

      // Move to the next page for the next iteration
      page++;
    }

    // Write the top 100 Node.js repositories with tests and coverage to a JSON file
    fs.writeFileSync('topNodeJSProjects.json', JSON.stringify(totalProjects.slice(0, 100), null, 2));

    console.log('Data has been written to topNodeJSProjects.json');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function getLastCommit(username, repoFullName) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${repoFullName}/commits/master`, {
      auth: {
        username,
        password: token,
      },
    });

    return response.data.sha;
  } catch (error) {
    //console.error(`Error fetching last commit information for ${repoFullName}:`, error.message);
    return null;
  }
}

async function getTestsAndCoverage(username, repoFullName) {
  try {
    // You may need to adapt this based on how test suites and coverage are stored in the repositories
    // This is just a placeholder function
    // For example, you can check for the existence of a 'test' directory and a coverage report file
    const testDirectoryExists = await axios.get(`https://api.github.com/repos/${repoFullName}/contents/test`, {
      auth: {
        username,
        password: token,
      },
    });

    return {
      hasTestSuite: testDirectoryExists.data.length > 0,
    };
  } catch (error) {
    //console.error(`Error fetching test information for ${repoFullName}:`, error.message);
    return {
      hasTestSuite: false,
    };
  }
}

// Run the script
getTopNodeJSProjects();
