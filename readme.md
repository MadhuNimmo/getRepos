### Setup Instructions

cd <<repo_name>>
git init
git remote add origin https://github.com/<<full_name>>.git
git fetch --depth 1 origin <<last_commit>>
git checkout FETCH_HEAD
npm install --force --ignore-scripts
