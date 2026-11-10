const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const cliRoot = path.dirname(require.resolve('@expo/cli/package.json', {
  paths: [path.dirname(require.resolve('expo/package.json'))],
}));
for (const filename of fs.readdirSync('cli-patch')) {
  fs.copyFileSync(path.join('cli-patch', filename), path.join(cliRoot, 'build/src/start/server/metro', filename));
}

const metroRoot = path.dirname(require.resolve('@expo/metro-config/package.json', { paths: [cliRoot] }));
fs.copyFileSync('metro-patch/collect-dependencies.js', path.join(metroRoot, 'build/transform-worker/collect-dependencies.js'));

execFileSync(process.execPath, [require.resolve('node-gyp/bin/node-gyp.js'), 'rebuild', '--directory', 'native'], { stdio: 'inherit' });
execFileSync(process.execPath, [path.join(cliRoot, 'bin/cli.js'), 'export', '--platform', 'web', '--clear'], { stdio: 'inherit' });
