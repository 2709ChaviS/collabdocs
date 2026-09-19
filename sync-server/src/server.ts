import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import { setupWSConnection, docs } from 'y-websocket/bin/utils';
import * as Y from 'yjs';
import { Pool } from 'pg';

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 1234;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Postgres pool error:', err);
});

async function loadDoc(docName: string, ydoc: Y.Doc) {
  try {
    const res = await pool.query('SELECT content FROM documents WHERE id = $1', [docName]);
    console.log(`[loadDoc] "${docName}" — rows found:`, res.rows.length);
    if (res.rows.length > 0 && res.rows[0].content) {
      const update = new Uint8Array(res.rows[0].content);
      Y.applyUpdate(ydoc, update);
      console.log(`[loadDoc] "${docName}" — applied update, size:`, update.length);
    }
  } catch (err) {
    console.error(`[loadDoc] "${docName}" — ERROR:`, err);
  }
}

async function saveDoc(docName: string, ydoc: Y.Doc) {
  try {
    const state = Y.encodeStateAsUpdate(ydoc);
    const buffer = Buffer.from(state);

    await pool.query(
      `INSERT INTO documents (id, content, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (id)
       DO UPDATE SET content = $2, updated_at = now()`,
      [docName, buffer]
    );
    console.log(`[saveDoc] "${docName}" — saved, size:`, buffer.length);
  } catch (err) {
    console.error(`[saveDoc] "${docName}" — ERROR:`, err);
  }
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('CollabDocs sync server running\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', async (conn, req) => {
  const docName = req.url?.slice(1).split('?')[0] || 'default';
  console.log(`[connection] room: "${docName}"`);

  setupWSConnection(conn, req, { gc: true });

  const ydoc = docs.get(docName) as Y.Doc | undefined;
  console.log(`[connection] ydoc found for "${docName}":`, !!ydoc);

  if (ydoc) {
    await loadDoc(docName, ydoc);

    let saveTimeout: NodeJS.Timeout | null = null;
    ydoc.on('update', () => {
      console.log(`[update] doc "${docName}" changed, scheduling save`);
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveDoc(docName, ydoc);
      }, 1000);
    });
  }
});

server.listen(PORT, () => {
  console.log(`Sync server listening on ws://localhost:${PORT}`);
});