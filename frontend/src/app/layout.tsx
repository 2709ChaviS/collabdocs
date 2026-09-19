import { ClerkProvider, Show, SignInButton, UserButton } from '@clerk/nextjs';
import './globals.css';
export const metadata = {
  title: 'CollabDocs — Real-time Collaborative Editor',
  description: 'A Google Docs-style collaborative editor with conflict-free CRDT sync, live presence, and offline support.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 24px',
              borderBottom: '1px solid #333',
            }}
          >
            <strong>CollabDocs</strong>
            <Show when="signed-out">
              <SignInButton mode="modal" />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}