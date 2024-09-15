#!/bin/bash

cd test-example

echo "Writing test lockfile ==============================="

ls node_modules/react-native
xchelper="node_modules/react-native/scripts/cocoapods/helpers.rb"
sed "s/xcodebuild -version/echo Xcode 16.0/g" "$xchelper" > "$xchelper"
ls node_modules/react-native/scripts/cocoapods/
echo "$xchelper"
cat "$xchelper"
yarn expo prebuild --clean -p ios
podfile=$(sed "s/prepare_react_native_project\!//g" ios/Podfile)
echo "puts File.join(File.dirname(\`node --print \"require.resolve('react-native/package.json')\"\`), \"scripts/react_native_pods\")" > ios/Podfile
echo "" >> ios/Podfile
echo "" >> ios/Podfile
echo "$podfile" >> ios/Podfile
cat ios/Podfile
echo "===="
ls node_modules/react-native/scripts/
echo "===="
yarn pod-lockfile --debug --project ./ios

yarn native-lock --debug write
write_result=$?

if [ $write_result -ne 0 ]; then
  cat ios/Podfile
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
