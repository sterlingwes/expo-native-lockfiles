# expo-native-lockfiles

Achieve more reproducible builds by committing your native project lockfiles to source control.

## What this does

This library is both a config plugin and a CLI tool for managing native mobile project lockfiles. By default, Expo's Continuous Native Generation ("CNG") pattern generates an iOS project with a Cocoapods lockfile, and an Android project with no Gradle lockfile, based on javascript dependencies locked with yarn.lock or similar. It allows you to:

- update & commit native lockfiles as you update and change JS dependencies
- ensure your CNG-managed native projects use those committed lockfiles and don't generate them on the fly with every expo prebuild
- setup a Gradle lockfile for your Android project

Not convinced? Read more about why this exists below.

## Getting started

- `yarn add -D expo-native-lockfiles`
- add `expo-native-lockfiles` as a plugin to your app.json or app.config.js
- setup an update approach of either:
  1. a CI check job that asserts that your native lockfiles didn't change (recommended)
  2. a postinstall step for your JS dependencies (quicker, slows down dependency installs)

### Lockfile Update Approaches

#### CI check

More efficient!

#### Postinstall step

Slower!

## Why this exists

You may notice the occasional drift in native dependencies with Expo's Managed Workflow (also known as Continuous Native Generation, "CNG") given that only the javascript dependency tree has dependency versions locked. This leaves the door open for the following scenario:

- javascript dependency relies on a native dependency with unfixed version
  - for example: iOS podspec has `~> 1.0` which means 1.1 would be an acceptable version
- the JS dependency's native dependency issues an update within the range of acceptable versions
- you run a build on EAS or `expo prebuild` and your project is generated, along with its native lockfile, based on the native dependency constraints dictated by your javascript dependency
  - in the above example, you may have previously has `1.0` for that native dependency in your `ios/Podfile.lock` but now it would be `1.1`, meaning that while your JS dependency hasn't changed, it's underlying native dependency has

The above may be desirable if you're OK with the risk that the underlying dependency does not use semantic versioning correctly and maintains backwards compatibility. Even if the version bump is not a breaking change it may have undesirable or unexpected runtime characteristics. This risk increases if the maintainer of the JS dependency is not also the maintainer of the native dependency it uses.

It can also be good to have visibility into the state of native dependencies for security scanning or supply chain management. With the recommended approach of ignoring the native project folders under CNG, you have no visibility into what dependencies your yarn lockfile-defined dependencies are pulling in.
