#!/bin/bash

set -e

echo "Running test env setup ====================="

rm -rf test-example example/ios example/android

yarn prepublishOnly

cp -r example test-example

cd test-example && yarn add ../
# make sure we resolve to the correct shared dependency
rm -rf node_modules/expo-native-lockfiles/node_modules

yarn pod-lockfile -h

echo "Finished test env setup ===================="
