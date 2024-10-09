#!/bin/bash

# Check if the projects directory exists
if [ ! -d "projects" ]; then
    echo "Directory 'projects' does not exist."
    exit 1
fi

# Extract the necessary fields from the JSON file using jq
eval "$( jq -r '@sh "git=( \([.[].full_name]) )"' ./getRepos/topNodeJSProjects.json )"
eval "$( jq -r '@sh "commit=( \([.[].commit_sha]) )"' ./getRepos/topNodeJSProjects.json )"

cd projects/

for ((i=0; i<${#git[@]}; i++))
do
    repo_name=$(echo "${git[i]}" | cut -d'/' -f2)

    # Check if the directory already exists
    if [ -d "$repo_name" ]; then
        echo "Directory $repo_name already exists. Skipping..."
        continue
    fi

    mkdir "$repo_name"
    cd "$repo_name"

    # If commit is 'null' or empty, clone without specifying the commit
    if [ -z "${commit[i]}" ] || [ "${commit[i]}" == "null" ]; then
        echo "Cloning latest version of ${git[i]}"
        git clone https://github.com/${git[i]}.git .
    else
        echo "Cloning specific commit ${commit[i]} from ${git[i]}"
        git init
        git remote add origin https://github.com/${git[i]}.git
        git fetch --depth 1 origin ${commit[i]}
        git checkout FETCH_HEAD
    fi

    # Ensure package.json exists before running npm install
    if [ -f "package.json" ]; then
        echo "Installing npm dependencies for ${repo_name}"
        npm install --force
    else
        echo "No package.json found in $repo_name. Skipping npm install."
    fi

    cd ..
done
