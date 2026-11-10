import { hashSync, verifySync } from '@node-rs/bcrypt';

export function GET() {
  const hash = hashSync('hello world', { cost: 4 });
  return Response.json({ hash, verified: verifySync('hello world', hash), platform: process.platform, arch: process.arch });
}
