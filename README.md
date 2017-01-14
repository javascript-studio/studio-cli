# JavaScript Studio CLI

The command line interface for the web service at <http://javascript.studio>.

## Install

```bash
npm install @studio/cli -g
```

## Configuration

Create `~/.studio/config` with this content:

```json
# JavaScript Studio Config
account=your_account
token=your_token
```

These properties can be configured:

- `account`: Your GitHub user name (required).
- `token`: A JavaScript Studio token. Get a token from
  <https://javascript.studio/settings> (required).
- `api`: The API endpoint to use. Defaults to `https://api.javascript.studio`

## Usage

```bash
$ echo "console.log('Hello JavaScript Studio!')" | studio
```

Script file with global entry point `entry`:

```bash
$ cat script.js | studio --global entry
```

For CommonJS projects, use [Browserify][1] to bundle the files. The `--debug`
option creates source maps which are recognized by the CLI.

From within a project directory:

```bash
$ browserify --debug --bare . | studio
```

From within a browser project directory with a global entry point:

```bash
$ browserify --debug -s entry . | studio --global entry
```

[1]: http://browserify.org
