import { WebSocketServer } from 'ws';
import http from 'http';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { LeveldbPersistence } from 'y-leveldb';

const PORT = process.env.PORT ? Number(process.env.PORT) : 1234;
const persistence = new LeveldbPersistence('./storage'); // saved to sync-server/storage folder

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('CollabDocs sync server running\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { gc: true });
});

// @ts-ignore — y-websocket reads this global to persist docs
(global as any).persistence = persistence;

server.listen(PORT, () => {
  console.log(`Sync server listening on ws://localhost:${PORT}`);
});