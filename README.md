# expo-native-lockfiles

Achieve more reproducible builds by committing your native project lockfiles to source control.

## What this does

This library is both a config plugin and a CLI tool for managing native mobile project lockfiles. By default, Expo's [Continuous Native Generation ("CNG")](https://docs.expo.dev/workflow/continuous-native-generation/) pattern generates an iOS project with a Cocoapods lockfile, and an Android project with no Gradle lockfile, based on javascript dependencies locked with yarn.lock or similar. This module ensures more stable inputs to your native builds by allowing you to:

- update & commit native lockfiles as you update and change JS dependencies that depend on native ones
- ensure your CNG-managed native projects reference the committed lockfiles and don't generate them on the fly with every expo prebuild
- setup a Gradle lockfile for your Android project

Not convinced? [Read more about why this exists below](#why-this-exists).

## Getting started

- `yarn add -D expo-native-lockfiles`
- add `expo-native-lockfiles` as a plugin to your app.json or app.config.js ([see example](https://github.com/sterlingwes/expo-native-lockfiles/blob/87359aa92e6bceccc6b30fee1b0c3a2ba921aa35/example/app.json#L31))
- setup an update approach of either:
  1. a CI check job that asserts that your native lockfiles didn't change (recommended)
  2. a postinstall step for your JS dependencies (quicker, slows down dependency installs)

## CLI Command

```
expo-native-lockfiles CLI
Usage: yarn native-lock [subcommand]

Subcommands:
  check: Check if lockfiles after prebuild are the same as those in the root of the repo.
  write: Write the lockfiles generated after prebuild to the root of the repo.
  help: Print this help message.

Options:
  --non-interactive: Skip interactive prompts (assumes 'yes').
  --debug: Print debug information.
```

## Lockfile Update Approaches

Choose one of the following approaches to keep your native lockfiles up to date and committed to your repository.

### CI check

A CI-based check that runs whenever your yarn.lock changes might be the least intrusive way to ensure your native lockfiles stay in sync with any JS-based dependency changes.

### Postinstall step

The easiest approach to setup, but least efficient is to add `yarn native-lock write` to your `postinstall` script in your package.json.

## Why this exists

You may notice the occasional drift in native dependencies with Expo's Managed Workflow (also known as Continuous Native Generation, "CNG") given that only the javascript dependency tree has dependency versions locked. This leaves the door open for the following scenario:

- javascript dependency relies on a native dependency with unfixed version
  - for example: iOS podspec has `~> 1.0` which means 1.1 would be an acceptable version
- the JS dependency's native dependency issues an update within the range of acceptable versions
- you run a build on EAS or `expo prebuild` and your project is generated, along with its native lockfile, based on the native dependency constraints dictated by your javascript dependency
  - in the above example, you may have previously has `1.0` for that native dependency in your `ios/Podfile.lock` but now it would be `1.1`, meaning that while your JS dependency hasn't changed, it's underlying native dependency has

The above may be desirable if you're OK with the risk that the underlying dependency does not use semantic versioning correctly and maintains backwards compatibility. Even if the version bump is not a breaking change it may have undesirable or unexpected runtime characteristics. This risk increases if the maintainer of the JS dependency is not also the maintainer of the native dependency it uses.

It can also be good to have visibility into the state of native dependencies for security scanning or supply chain management (SAST scans). With the recommended approach of ignoring the native project folders under CNG, you have no visibility into what dependencies your yarn lockfile-defined dependencies are pulling in.

## Roadmap to v1

Things to iron out:

- [x] get full scenario CI test workflow passing (issue w/ plugin always writing?)
- [ ] make android opt-in for now (composite builds aren't covered by "app" lockfile so it's a partial picture)
- [ ] make xcode version (and others?) clearer and configurable
- [ ] allow for running for a specific platform
- [ ] provide better API or guidance for upgrade path (Expo / React Native bumps)
- [ ] figure out how to speed up the gradle lockfile write (--offline w/ cache?)
- [ ] add a simple readme example for CI check config
