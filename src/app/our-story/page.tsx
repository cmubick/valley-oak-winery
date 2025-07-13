import Link from 'next/link';

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              <Link href="/">Valley Oak Winery</Link>
            </h1>
            <nav className="space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Wines</Link>
              <Link href="/our-story" className="text-blue-600 font-semibold">Our Story</Link>
              <Link href="/wine-club" className="text-gray-600 hover:text-gray-900">Wine Club</Link>
              <Link href="/pictures" className="text-gray-600 hover:text-gray-900">Pictures</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-8 py-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Our Story</h1>
            
            <div className="prose prose-lg mx-auto text-gray-700">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">A Legacy of Excellence</h2>
                <p className="mb-4">
                  Valley Oak Winery was founded in 1987 with a simple vision: to create exceptional wines that capture 
                  the essence of our terroir and the passion of our craft. Nestled in the heart of California&apos;s 
                  premier wine country, our vineyard spans 150 acres of pristine land that has been carefully 
                  cultivated for over three decades.
                </p>
                <p className="mb-4">
                  Our founder, Maria Gonzalez, immigrated from Spain with generations of winemaking knowledge 
                  and an unwavering commitment to quality. She believed that great wine begins in the vineyard, 
                  and every bottle should tell the story of the land, the season, and the people who crafted it.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Philosophy</h2>
                <p className="mb-4">
                  We practice sustainable viticulture, working in harmony with nature to produce grapes of 
                  exceptional quality. Our winemaking philosophy combines traditional techniques passed down 
                  through generations with modern innovations that enhance the natural characteristics of our fruit.
                </p>
                <p className="mb-4">
                  Every decision we make, from vineyard management to bottle design, is guided by our commitment 
                  to environmental stewardship and creating wines that honor our heritage while embracing the future.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">The Family Tradition</h2>
                <p className="mb-4">
                  Today, Valley Oak Winery is run by the second generation of the Gonzalez family. Maria&apos;s daughter, 
                  Sofia, serves as our head winemaker, bringing both traditional knowledge and contemporary expertise 
                  to every vintage. Her son, Diego, manages our vineyard operations with the same dedication to 
                  quality that has defined our winery for over 35 years.
                </p>
                <p>
                  We invite you to visit us and experience the passion, tradition, and innovation that goes into 
                  every bottle of Valley Oak Winery wine. Come taste not just our wine, but our story.
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Visit Us</h3>
                <p className="text-gray-700">
                  <strong>Address:</strong> 1234 Vineyard Lane, Napa Valley, CA 94558<br />
                  <strong>Hours:</strong> Daily 10am - 5pm<br />
                  <strong>Phone:</strong> (707) 555-WINE<br />
                  <strong>Email:</strong> visit@heritagewinery.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
