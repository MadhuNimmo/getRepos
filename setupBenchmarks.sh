#!/bin/bash

eval "$( jq -r '@sh "git=( \([.[].full_name]) )"' ./topNodeJSProjects.json )"
eval "$( jq -r '@sh "commit=( \([.[].last_commit]) )"' ./topNodeJSProjects.json )"

cd tests/

for ((i=0; i<${#git[@]};i++))
do
word=$(echo "${git[i]}" | cut -d'/' -f2)
mkdir "$word"
cd "$word"
git init
git remote add origin https://github.com/${git[i]}.git
git fetch --depth 1 origin ${commit[i]}
git checkout FETCH_HEAD
npm install --force
cd ..
done