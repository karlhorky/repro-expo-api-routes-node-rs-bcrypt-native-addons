const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

fs.copyFileSync('pnpm-workspace.native-addons.yaml', 'pnpm-workspace.yaml');
execFileSync('pnpm', ['install', '--no-frozen-lockfile'], { stdio: 'inherit' });

const cliRoot = path.dirname(require.resolve('@expo/cli/package.json', {
  paths: [path.dirname(require.resolve('expo/package.json'))],
}));

execFileSync(process.execPath, [require.resolve('node-gyp/bin/node-gyp.js'), 'rebuild', '--directory', 'native'], { stdio: 'inherit' });
execFileSync(process.execPath, [path.join(cliRoot, 'bin/cli.js'), 'export', '--platform', 'web', '--clear'], { stdio: 'inherit' });
