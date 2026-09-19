declare module 'y-websocket/bin/utils' {
  import * as Y from 'yjs';
  export function setupWSConnection(conn: any, req: any, opts?: any): void;
  export const docs: Map<string, Y.Doc>;
}