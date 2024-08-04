#!/usr/bin/env bash

set -e

cd ../api-mocking-app-sharing

rsync ../tcc-app-sharing/ . \
  --archive \
  --verbose \
  --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude scripts
