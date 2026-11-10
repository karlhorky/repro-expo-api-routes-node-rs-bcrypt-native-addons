import { createRequire } from 'node:module';

export function GET() {
  const nodeRequire = createRequire(`${process.cwd()}/package.json`);
  const bcrypt = nodeRequire('@node-rs/bcrypt');
  const hash = bcrypt.hashSync('hello world', { cost: 4 });
  return Response.json({ hash, verified: bcrypt.verifySync('hello world', hash) });
}
