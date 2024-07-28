#!/usr/bin/env bash

set -e

cd ../api-mocking-app-sharing

cp -r ../tcc-app-sharing .
rm -rf tcc-app-sharing/.git
cp -rT tcc-app-sharing .

rm -rf tcc-app-sharing scripts

git add .
git commit --amend --no-edit
