'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ApiStatus {
  status: string;
  database: string;
  timestamp: string;
  error?: string;
}

export default function ApiTest() {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to connect to backend');
        return res.json();
      })
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Backend Connection Test</h1>
      
      {loading && <p className="text-blue-500">Connecting to backend...</p>}
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
          <p className="mt-2 text-sm text-red-600">
            Make sure your backend server is running (npm run dev in /backend)
          </p>
        </div>
      )}

      {status && (
        <div className="p-4 bg-green-100 text-green-700 rounded-md">
          <p className="font-semibold">Successfully Connected!</p>
          <pre className="mt-2 text-sm">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6">
        <Link href="/" className="text-zinc-600 hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}
