# Studio CLI

JavaScript Studio is a cloud service that finds errors in JavaScript programs
by dynamically evaluating the source code in a custom runtime. If you do not
have an account, log in with GitHub at <https://javascript.studio>.

This command line tool encrypts and uploads source code to the [JavaScript
Studio][1] web service, fetches the error report and prints the results.

## Install

```bash
npm install @studio/cli -g
```

## Configuration

The CLI will try to load a configuration file in these locations:

- `.studio` in the current directory
- `.studio` in your home directory
- `$XDG_CONFIG_HOME/studio`
- `.config/studio` in your home directory

Copy your personal configuration from <https://javascript.studio/settings> into
your preferred location. Never check this file into version control.

### Environment variables

The access token and the encryption secret can also be specified via
environment variables:

- `STUDIO_TOKEN`: Your access token.
- `STUDIO_SECRET`: Your encryption secret.

Environment variables take precedence over configured values. If `STUDIO_TOKEN`
is defined, the `.studio` file is optional.

### Available options

These properties can be configured:

- `token`: Your access token (required).
- `secret`: Your encryption secret. If provided, uploads are encrypted.
- `api`: The API endpoint to use. Defaults to
  `https://api.javascript.studio/beta`.

## Usage

Run `studio --help` for all available options. A usage guide can be found at
<https://javascript.studio/docs/using-the-client>.

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
