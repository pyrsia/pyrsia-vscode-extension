#!/usr/bin/env bash

set -e

RELTYPE=$1

if [ "$RELTYPE" == "" ]; then
  RELTYPE="nightly"
fi

npm install -g @vscode/vsce
BINARY_FILE_NAME="pyrsia_vs_code_`date +%Y_%m_%d`.vsix"
vsce package -o $BINARY_FILE_NAME --allow-star-activation
WORKSPACE=$PWD
cd installers/vsrepo
mkdir -p repos/$RELTYPE
gsutil -m rsync -r gs://vsrepo/repos repos
mv $BINARY_FILE_NAME repos/$RELTYPE
cd repos/$RELTYPE

# Generate pretty directory listing web pages
python3 $WORKSPACE/.github/workflows/genlisting.py -r

# copy new public repo to GCS
gsutil -m rsync -r repos gs://vsrepo/repos
