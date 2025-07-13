import { Wine } from '@/lib/dynamodb';
import WineCard from '@/components/WineCard';
import Link from 'next/link';

async function getWines(): Promise<Wine[]> {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/wines`, {
    cache: 'no-store' // Ensure fresh data for SSR
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch wines');
  }
  
  return res.json();
}

export default async function HomePage() {
  const wines = await getWines();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Valley Oak Winery
            </h1>
            <nav className="space-x-8">
              <Link href="/" className="text-blue-600 font-semibold">Wines</Link>
              <Link href="/our-story" className="text-gray-600 hover:text-gray-900">Our Story</Link>
              <Link href="/wine-club" className="text-gray-600 hover:text-gray-900">Wine Club</Link>
              <Link href="/pictures" className="text-gray-600 hover:text-gray-900">Pictures</Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Our Wines</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {wines.map((wine) => (
                <WineCard key={wine.id} wine={wine} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
