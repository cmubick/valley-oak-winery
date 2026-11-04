'use client';

import { useEffect, useState } from 'react';
import type { InstagramStatus } from '@/lib/instagram';

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

// Shows whether the Pictures page's Instagram feed is healthy.
export default function InstagramStatusCard() {
  const [status, setStatus] = useState<InstagramStatus | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/api/instagram/status')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStatus)
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return <Card tone="red" title="Instagram feed: status unavailable">Couldn&apos;t read the feed status.</Card>;
  }
  if (!status) return null;

  if (!status.connected) {
    return (
      <Card tone="amber" title="Instagram feed: not connected">
        The Pictures page is showing fallback photos. Connect the account with{' '}
        <code className="bg-gray-100 px-1 rounded">npm run instagram-token -- --prod</code> (see README).
      </Card>
    );
  }

  const expiringSoon = status.expiresAt && new Date(status.expiresAt).getTime() - Date.now() < 14 * 24 * 3600 * 1000;
  const tone = status.lastError || expiringSoon ? 'amber' : 'green';

  return (
    <Card tone={tone} title={`Instagram feed: connected${status.username ? ` as @${status.username}` : ''}`}>
      Token renews automatically. Last renewed {fmt(status.refreshedAt)}
      {status.expiresAt && <>, expires {fmt(status.expiresAt)}</>}.
      {status.lastError && (
        <div className="mt-1 text-red-700">
          Last error ({fmt(status.lastErrorAt)}): {status.lastError}
        </div>
      )}
    </Card>
  );
}

const TONES = {
  green: 'border-green-200 bg-green-50',
  amber: 'border-amber-300 bg-amber-50',
  red: 'border-red-300 bg-red-50',
};

function Card({ tone, title, children }: { tone: keyof typeof TONES; title: string; children: React.ReactNode }) {
  return (
    <div className={`mb-6 rounded-lg border px-4 py-3 text-sm text-gray-700 ${TONES[tone]}`}>
      <div className="font-semibold text-gray-900">{title}</div>
      <div>{children}</div>
    </div>
  );
}
