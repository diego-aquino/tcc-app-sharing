#!/usr/bin/env bash

set -e

git checkout main-v1
git rebase main
git push --force

git checkout main-v2
git rebase main-v1
git push --force

git checkout main

cd ../api-mocking-app-sharing

rsync ../tcc-app-sharing/ . \
  --archive \
  --verbose \
  --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude scripts
