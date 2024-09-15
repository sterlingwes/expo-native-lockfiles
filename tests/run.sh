#!/bin/bash

cd test-example

echo "Writing test lockfile ==============================="

le node_modules/react-native
yarn pod-lockfile --debug --project ./ios

yarn native-lock --debug write
write_result=$?

if [ $write_result -ne 0 ]; then
  echo "Failed to write native lock files"
  exit 1
fi

echo "Checking lockfile ==============================="

yarn native-lock --debug check
check_result=$?

if [ $check_result -ne 0 ]; then
  echo "Native lockfile check failed"
  exit 1
fi
