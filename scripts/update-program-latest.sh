#!/bin/bash
set -euo pipefail

WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROGRAM_DIR=$WORKSPACE_DIR/swig-program

if [ ! -d "$PROGRAM_DIR/.git" ]; then
  echo "⚠️ Could not find swig program .git dir. Cloning from source..." 
  rm -rf $PROGRAM_DIR
  git clone -q git@github.com:anagrambuild/swig-wallet.git $PROGRAM_DIR
else
  cd $PROGRAM_DIR
  echo "pulling swig program latest from main..."
  git checkout main > /dev/null 2>&1
  git pull origin main -q
fi

cd $PROGRAM_DIR

echo "Program directory updated!"
echo "building swig program..."
cargo build-sbf -- -q > /dev/null 2>&1
cp target/deploy/swig.so $WORKSPACE_DIR 

echo "✅ Program updated: $WORKSPACE_DIR/swig.so"