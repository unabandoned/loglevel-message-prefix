# loglevel Message prefix plugin

> **This is a maintained fork of [NatLibFi/loglevel-message-prefix][upstream], published as
> [`@unabandoned/loglevel-message-prefix`][pkg].** Upstream was archived in 2017 and both of its
> npm names (`loglevel-message-prefix`, deprecated, and `@natlibfi/loglevel-message-prefix`) have
> had no release since. The plugin's behaviour is unchanged; the fork drops the `es6-polyfills`
> dependency (it only supplied `Object.assign`, which every supported engine has natively) and
> declares `loglevel` as a peer dependency. See [.unabandoned.yml](.unabandoned.yml).

[upstream]: https://github.com/NatLibFi/loglevel-message-prefix
[pkg]: https://www.npmjs.com/package/@unabandoned/loglevel-message-prefix

Plugin for [loglevel](https://github.com/pimterry/loglevel) which allows defining prefixes for log messages

## Usage

### Installation

```sh
npm install loglevel @unabandoned/loglevel-message-prefix
```

To keep existing `require('loglevel-message-prefix')` / `import ... from 'loglevel-message-prefix'`
calls working, install it under its old name with an alias:

```json
"loglevel-message-prefix": "npm:@unabandoned/loglevel-message-prefix@^3.1.0"
```

`loglevel` is a peer dependency: the plugin decorates the logger you pass in, so it uses your copy.

## Testing

```sh
npm test
```

#### AMD

```javascript

define(['loglevel', 'loglevel-message-prefix'], function(log, loglevelMessagePrefix) {

  loglevelMessagePrefix(log, {
    staticPrefixes: ['foobar']
  });

  log.warn('TEST');

});

```

#### Node.js require

```javascript

var log = require('loglevel');
var loglevelMessagePrefix = require('loglevel-message-prefix');

loglevelMessagePrefix(log, {
  staticPrefixes: ['foobar']
});

log.warn('TEST');

```

### Example

**Code**:

```javascript

var log = require('loglevel-message-prefix')(require('loglevel'), {
    prefixes: ['level'],
    staticPrefixes: ['foo', 'bar'],
    separator: '/'
});

log.setLevel('info');

log.info('Testing');

```

**Output**:

```
[INFO/foo/bar]: Testing

```

## Configuration

The configuration object is passed as the second argument to the function. Following properties are supported ():

- **prefixes**: An array of predefined dynamic prefixes that are to be used. Defaults to: `['timestamp', 'level']`. Available prefixes are:
  - *timestamp*: Add locale-specific timestamp
  - *level*: Add log level prefix
- **staticPrefixes**: An array of strings that should be added after dynamic prefixes (E.g. 'foo'). Defaults to none.
- **prefixFormat**: A string template to format the prefix (``%p`` is replaced with the prefix). Defaults to `[%p]:
`
- **separator**: String used to separate prefixes. Defaults to single whitespace (` `).
- **options**: Options for dynamic prefixes. Available options are:
  - *timestamp*: An object of properties for date formatting. Available properties are: *locale*, *timezone* and *hour12*. Defaults to `{hour12: false}`

## License and copyright

Copyright (c) 2015-2017 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **MIT License**.
