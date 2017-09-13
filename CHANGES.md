# Changes

## 1.2.0

- 🍏 Render call tree
- 📚 Invitation is not required anymore

## 1.1.1

- 📚 Align documentation with JavaScript Studio website

## 1.1.0

- 🍏 Support `XDG_CONFIG_HOME` and `~/.config` as config locations

## 1.0.2

- 🐛 Set process exit code to 64 if either parser or runtime errors where found

## 1.0.1

- 🐛 Only set the process exit code to 64 if errors where found

## 1.0.0

- 🍏 Add support for encrypted uploads with "aes-128-ctr"
- 🍏 Allow to specify the token and the encryption secret in environment
  variables
- 🍏 Exit with code 64 if errors where found
- 🍏 Make `.studio` file optional if `STUDIO_TOKEN` is defined
- 🍏 Allow to load the config from `.studio` or `~/.studio`
- 🍏 Show error message from API response
- 🍏 Handle status 402
- 🍏 Remove obsolete "account" from config
- 🐛 Handle missing `errors` in failed builds
- 📚 Improve documentation
- ✨ Use `@studio/json-request` v2.0
- ✨ Add package-lock.json
- ✨ Add LICENSE

## 0.6.0

- 🍏 Render values from occurrences
- 🍏 Improve error report layout and coloring
- 🐛 Make location regexp more loose

## 0.5.2

- 🐛 Increase timeout for `CREATED` builds

## 0.5.1

- 🐛 Handle weird node locs

## 0.5.0

- 🍏 Show source snippet from source map
- 🍏 Read source maps from file

## 0.4.0

- 🍏 Explicitly handle 403s
- 🐛 Fix indentation of non-matching stack frames

## 0.3.3

- 🐛 Fail if config fail can not be read
- 🐛 Fix function name handling in stack traces

## 0.3.2

- 🙈 Support Node 4

## 0.3.1

- 🐛 Enable logger if `--debug` or failure

## 0.3.0

- 🍏 Use [@studio/log][] and [ora][] spinner
- 🍏 Add `--debug` option

[@studio/log]: https://github.com/javascript-studio/studio-log
[ora]: https://github.com/sindresorhus/ora

## 0.2.0

- 🍏 Add `--exceptions` option
- 🍏 Show build stats

## 0.1.0

- ✨ Initial release.
