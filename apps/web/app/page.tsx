import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-fedha-navy">
      <div className="text-center text-white px-6">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Fedha</h1>
        <p className="text-white/70 mb-8">Your Financial Operating System.</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-fedha-gold text-fedha-navy font-semibold hover:opacity-90"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg border border-white/30 text-white font-semibold hover:bg-white/10"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
