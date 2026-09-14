'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

const COLORS = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'];

function randomFrom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function DocPage() {
  const params = useParams();
  const docId = params.docId as string;
  const { user } = useUser();
  const [copied, setCopied] = useState(false);

  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [status, setStatus] = useState('connecting');
  const [users, setUsers] = useState<{ name: string; color: string }[]>([]);

  // connect to sync server + local persistence
  useEffect(() => {
    if (!docId) return;

   const SYNC_SERVER_URL = process.env.NEXT_PUBLIC_SYNC_SERVER_URL || 'ws://localhost:1234';
const wsProvider = new WebsocketProvider(SYNC_SERVER_URL, docId, ydoc);
    const idbProvider = new IndexeddbPersistence(docId, ydoc);

    wsProvider.on('status', (event: { status: string }) => {
      setStatus(event.status);
    });

    idbProvider.on('synced', () => {
      console.log(`Doc "${docId}" loaded from IndexedDB`);
    });

    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
      idbProvider.destroy();
    };
  }, [docId, ydoc]);

  // save to recent documents list
  useEffect(() => {
    if (!docId) return;
    const raw = localStorage.getItem('collabdocs-recent');
    const recents: { id: string; lastOpened: number }[] = raw ? JSON.parse(raw) : [];
    const filtered = recents.filter((r) => r.id !== docId);
    filtered.unshift({ id: docId, lastOpened: Date.now() });
    localStorage.setItem('collabdocs-recent', JSON.stringify(filtered.slice(0, 20)));
  }, [docId]);

  // track live presence
  useEffect(() => {
    if (!provider) return;

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());
      const list = states.map((s: any) => s.user).filter(Boolean);
      setUsers(list);
    };

    provider.awareness.on('change', updateUsers);
    updateUsers();

    return () => provider.awareness.off('change', updateUsers);
  }, [provider]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: false }),
        ...(provider
          ? [
              Collaboration.configure({ document: ydoc }),
              CollaborationCursor.configure({
                provider,
                user: {
                  name: user?.fullName || user?.username || 'Anonymous',
                  color: randomFrom(COLORS),
                },
              }),
            ]
          : []),
      ],
      immediatelyRender: false,
    },
    [provider, user]
  );

  const copyShareLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!editor) return null;

  return (
    <main style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
      <a href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
        ← Back to documents
      </a>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: '#888' }}>
          Document: <strong style={{ color: '#ddd' }}>{docId}</strong>
        </div>
        <button
          onClick={copyShareLink}
          style={{
            padding: '7px 16px',
            borderRadius: 6,
            background: copied ? '#22c55e' : '#1c1c1c',
            color: '#fff',
            border: '1px solid #333',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {copied ? '✓ Link copied' : 'Share'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: status === 'connected' ? '#22c55e' : '#f59e0b',
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: 13, color: '#999' }}>
          {status === 'connected' ? 'Connected' : 'Reconnecting…'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {users.map((u, i) => (
          <span
            key={i}
            style={{
              background: u.color,
              color: '#fff',
              padding: '3px 12px',
              borderRadius: 12,
              fontSize: 12.5,
              fontWeight: 500,
            }}
          >
            {u.name}
          </span>
        ))}
      </div>

      <div
        style={{
          border: '1px solid #2a2a2a',
          borderRadius: 10,
          padding: 20,
          minHeight: 450,
          background: '#0f0f0f',
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </main>
  );
}