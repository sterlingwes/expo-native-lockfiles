#!/bin/bash

set -e

echo "Running test env setup ====================="

rm -rf test-example example/ios example/android

yarn prepublishOnly

cp -r example test-example

cd test-example && yarn add ../

echo "Finished test env setup ===================="
