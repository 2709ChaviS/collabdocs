'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, SignInButton } from '@clerk/nextjs';

function generateDocId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [recents, setRecents] = useState<{ id: string; lastOpened: number }[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('collabdocs-recent');
    if (raw) setRecents(JSON.parse(raw));
  }, []);

  const createDoc = () => {
    const id = generateDocId();
    router.push(`/doc/${id}`);
  };

  return (
    <main
      style={{
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '80px 20px 40px',
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: 1.5,
          color: '#888',
          marginBottom: 20,
          border: '1px solid #333',
          padding: '5px 14px',
          borderRadius: 20,
          textTransform: 'uppercase',
        }}
      >
        Real-time · Conflict-free · Team ready
      </div>

      <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 16, maxWidth: 700, textAlign: 'center', lineHeight: 1.15 }}>
        Write together, in real time.
      </h1>

      <p style={{ fontSize: 17, color: '#999', maxWidth: 540, marginBottom: 36, textAlign: 'center', lineHeight: 1.6 }}>
        CollabDocs is a live collaborative editor with conflict-free sync, presence
        cursors, and offline-safe editing — built for teams who want their documents
        private and instant.
      </p>

      {isSignedIn ? (
        <button onClick={createDoc} style={primaryBtn}>
          + New Document
        </button>
      ) : (
        <SignInButton mode="modal">
          <button style={primaryBtn}>Get Started — it's free</button>
        </SignInButton>
      )}

      <div style={{ display: 'flex', gap: 48, marginTop: 72, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800 }}>
        {[
          ['Live Sync', "Every keystroke merges instantly across every device, no refresh needed."],
          ['Presence', "See exactly who's editing, and where their cursor is, in real time."],
          ['Private by Default', 'Every document lives behind sign-in — no public links, no leaks.'],
        ].map(([icon, title, desc]) => (
          <div key={title as string} style={{ maxWidth: 220, textAlign: 'center' }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>{title}</div>
            <div style={{ fontSize: 13.5, color: '#888', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      {isSignedIn && recents.length > 0 && (
        <div style={{ width: '100%', maxWidth: 640, marginTop: 80 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Recent Documents
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recents.map((r) => (
              <button
                key={r.id}
                onClick={() => router.push(`/doc/${r.id}`)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: '#161616',
                  border: '1px solid #2a2a2a',
                  color: '#eee',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14,
                }}
              >
                <span>📄 {r.id}</span>
                <span style={{ fontSize: 12, color: '#777' }}>
                  {new Date(r.lastOpened).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: '14px 32px',
  borderRadius: 8,
  background: '#fff',
  color: '#111',
  border: 'none',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
};