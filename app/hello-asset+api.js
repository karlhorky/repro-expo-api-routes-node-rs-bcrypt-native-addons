import addon from '../native/build/Release/hello.node';

export function GET() {
  return Response.json({ type: typeof addon, value: addon });
}
