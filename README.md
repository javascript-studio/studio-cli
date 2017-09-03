# Studio CLI

This command line tool encrypts and uploads source code to the [JavaScript
Studio][1] web service, fetches the error report and prints the results.

JavaScript Studio is a cloud service that finds errors in JavaScript programs
by dynamically evaluating the source code in a custom runtime. If you do not
have an account, request an invite at <https://javascript.studio>.

## Install

```bash
npm install @studio/cli -g
```

## Configuration

The CLI will try to load a configuration file in these locations:

- `.studio` in the current directory
- `.studio` in your home directory
- If `XDG_CONFIG_HOME` is defined in `${XDG_CONFIG_HOME}/studio`
- `.config/studio` in your home directory

Copy your personal configuration from <https://javascript.studio/settings> into
your preferred location. Never check this file into version control. The token
is associated with your personal GitHub account.

These properties can be configured:

- `token`: Your access token (required).
- `secret`: Your encryption secret. If provided, uploads are encrypted.
- `api`: The API endpoint to use. Defaults to
  `https://api.javascript.studio/beta`.

The access token and the encryption secret can also be specified via
environment variables:

- `STUDIO_TOKEN`: Your access token.
- `STUDIO_SECRET`: Your encryption secret.

Environment variables take precedence over configured values. If `STUDIO_TOKEN`
is defined, the `.studio` file is optional.

## Usage

Run `studio --help` for all available options.

Pipe any JavaScript to the `studio` command or specify a file to analyze:

```bash
# Analyze a file:
studio --file script.js

# Using a pipe:
echo "unknownFunction()" | studio

# With a global entry point or namespace:
studio -f script.js --global entry

# With browserify:
browserify --debug script.js | studio

# With browserify as a standalone module:
browserify --debug script.js -s thing | studio --global thing

# With WebPack:
webpack --devtool source-maps app/index.js dist/bundle.js
studio --file dist/bundle.js

# With WebPack as a library:
webpack --devtool source-maps --output-library thing app/module.js dist/library.js
studio --file dist/library.js --global thing
```

Inline source maps are used to map stack traces back to your original sources.
If source maps are in a separate file, using `--file` automatically resolves
the source maps file.

## Related modules

- 📡 [Studio JSON Request][2] is used for API calls.
- 👻 [Studio Log][3] is used for logging.
- 📦 [Studio Changes][4] is used to create the changelog for this module.

## License

MIT

<div align="center">Made with ❤️ on 🌍</div>

[1]: https://javascript.studio
[2]: https://github.com/javascript-studio/studio-json-request
[3]: https://github.com/javascript-studio/studio-log
[4]: https://github.com/javascript-studio/studio-changes
