# Expo Router API Routes with Node.js native addons

Reproduce native addon import failures with `@node-rs/bcrypt@2.0.0` and a tiny Node-API addon exporting `hello()`.

[Expo PR #53246](https://github.com/expo/expo/pull/53246) includes a working prototype for local development and exported Node.js servers. The PR remains a draft for review of the approach, including how it should use Expo's upcoming serializer changes.

The optional-import change extends Metro's existing rule to nested blocks for all packages and needs maintainer review. The server export code also needs review against [PR #52949](https://github.com/expo/expo/pull/52949) and [PR #52951](https://github.com/expo/expo/pull/52951), which move final filename handling into the serializer.

This repro uses CommonJS package settings. The separate [export issue with `type: module`](https://github.com/expo/expo/issues/52690) is not resolved by these changes.

## Requirements

- Node.js 24
- pnpm 12.6.0
- Python and a C compiler for node-gyp (Command Line Tools for Xcode on macOS)

## Reproduction

```sh
pnpm install --ignore-scripts
pnpm build-addon
pnpm control
pnpm start
```

In another terminal:

```sh
curl --include http://localhost:8123/hello
curl --include http://localhost:8123/hash
curl --include http://localhost:8123/hello-commonjs
```

The Node.js control hashes and verifies a password and calls `hello()`. The API requests return HTTP 500:

| Route | Error |
| --- | --- |
| `/hello` | `Unable to resolve module ../native/build/Release/hello.node` |
| `/hash` | `Unable to resolve module ./bcrypt.wasi.cjs` |
| `/hello-commonjs` | `Unable to resolve module ./build/Release/hello.node` |

See the [request results](logs/before-api-requests.txt), [Expo CLI output](logs/before-expo-start.txt), and [Node.js control output](logs/nodejs-control.txt).

`pnpm export` also fails. See the [export output](logs/before-export.txt).

There is no `metro.config.js` and no extension configuration.

## Test the PR prototype

Stop the previous server, then run:

```sh
pnpm build
pnpm start
```

`pnpm build` installs the pnpm patches in `patches/`, builds the hello addon, and exports the app. The patches apply the native-addon changes from Expo PR commit [`277d0aee21b057a9888ac38f573e00cdb405d558`](https://github.com/expo/expo/commit/277d0aee21b057a9888ac38f573e00cdb405d558) to `@expo/cli@58.1.18` and `@expo/metro-config@58.0.20`. The original compiled snapshots remain in `cli-patch/` and `metro-patch/` for the earlier investigation. Their Expo MIT license is in `LICENSE.expo`.

To use these patches in another Expo SDK 58 app, copy `patches/` and merge `pnpm-workspace.native-addons.yaml` into the app's `pnpm-workspace.yaml`, then run `pnpm install`. No Metro configuration is needed.

Request the same three routes. They return HTTP 200 with the native hello message or a bcrypt hash and `verified: true`. See the [request results](logs/after-api-requests.txt) and [export output](logs/after-export.txt).

To serve the export:

```sh
pnpm serve
curl --include http://localhost:8124/hello
curl --include http://localhost:8124/hash
curl --include http://localhost:8124/hello-commonjs
```

I also moved the exported app to a different directory, with no `node_modules`, and temporarily renamed both original `.node` files. The same three routes returned HTTP 200. See the [moved-export request results](logs/after-moved-api-requests.txt).

## Where the failures occur

1. The dependency collector treats `@node-rs/bcrypt`'s missing WASI fallback as required, because its `require()` is inside an `if` inside a `try` block. The optional-import change in the PR lets the package skip this missing fallback.
2. With only that optional-import change, `/hash` still fails with `Cannot find native binding`. The `.node` file is not recognized by the default Metro configuration, and `/hello` still fails to resolve its binary.
3. Registering `node` in `sourceExts` makes Metro find the binary, then try to parse it as JavaScript (`Unexpected character '�'. (1:0)`).
4. Registering `node` in `assetExts` produces an asset URL string. `/hello` fails with `hello is not a function`, and `/hash` fails with `Incompatible bcrypt binary: rebuild or reinstall the matching @node-rs/bcrypt backend`.
5. Loading `@node-rs/bcrypt` through Node.js `createRequire()` in `/native-require` works throughout these tests. This route loads from the project folder and is a control for the import tests.
6. The full PR prototype recognizes `.node` files automatically, loads them through Node.js, and copies native files into server exports with paths relative to each route.

See the [native-loading stages](logs/native-loading-stages.txt) and their server output ([default](logs/native-loading-default-server.txt), [sourceExts](logs/native-loading-sourceExts-server.txt), [assetExts](logs/native-loading-assetExts-server.txt)). These intermediate stages include the optional-import change and the published CLI's native loading behavior. Binary code frames are omitted from the parser errors.

The diagnostic `/hello-asset` route records the imported value. With the intermediate `assetExts` configuration it returns a string asset URL. With the full PR changes it receives the native exports.

## Vercel

The [Vercel deployment](https://repro-expo-native-addons-ap5tcplon-karlhorkys-projects.vercel.app) uses the same `/hello`, `/hash`, and `/hello-commonjs` routes, the four compiled package files, and Expo's [documented Vercel adapter configuration](https://docs.expo.dev/router/web/api-routes/#vercel). The function includes `dist/server/**`.

Vercel compiles `hello.node` on Linux x64. `@node-rs/bcrypt` selects the Linux binary automatically. All three deployed routes return HTTP 200, including successful password verification. See the [build output](logs/vercel-build.txt) and [request results](logs/vercel-requests.txt).

The deployment has Vercel authentication protection. The request results were captured using `vercel curl`.

## Tested versions

- macOS 27.2 arm64, Node.js 24.13.0, pnpm 12.6.0
- Vercel build: Linux x64, Node.js 24.22.2
- Expo 58.0.17
- Expo Router 58.0.25
- Installed `@expo/cli` 58.1.18 and `@expo/metro-config` 58.0.20, with the compiled PR files for the prototype checks
- Metro 0.87.1
- `@node-rs/bcrypt` 2.0.0
- node-gyp 13.1.0

The [earlier repro](https://github.com/karlhorky/repro-expo-router-api-routes-node-rs-bcrypt-assetexts) contains the original `assetExts` investigation and additional loader diagnostics.
