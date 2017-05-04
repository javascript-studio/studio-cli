# JavaScript Studio CLI

Uploads source code to the [JavaScript Studio][1] web service, fetches the
error report and prints the results.

JavaScript Studio is a cloud service that finds errors in JavaScript programs
by dynamically evaluating the source code in a custom runtime. If you do not
have an account, request an invite at <http://javascript.studio>.

## Install

```bash
npm install @studio/cli -g
```

## Configuration

Create a `.studio` file in your home directory with this content:

```bash
# JavaScript Studio CLI Config
token=your_token
```

Never check this file into version control. The token is associated with your
personal GitHub account. A new token can be created at
<https://javascript.studio> which will invalidate the previous token.

If a `.studio` file is found in the current directory, it is loaded instead of
the file in the home directory.

These properties can be configured:

- `token`: Your JavaScript Studio access token (required).
- `api`: The API endpoint to use. Defaults to
  `https://api.javascript.studio/beta`

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
```

Inline source maps are used to map stack traces back to your original sources.
If source maps are in a separate file, use `--file` and the source maps will
resolved.

WebPack always writes to files. Use `studio --file script.js` to scan a file.

## License

MIT

[1]: http://javascript.studio
