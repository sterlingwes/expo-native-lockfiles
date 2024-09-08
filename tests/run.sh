#!/bin/bash

yarn setup

cd example
yarn native-lock write
write_result=$?

if [ $write_result -ne 0 ]; then
  echo "Failed to write native lock files"
  exit 1
fi

yarn native-lock check
check_result=$?

if [ $check_result -ne 0 ]; then
  echo "Native lockfile check failed"
  exit 1
fi
