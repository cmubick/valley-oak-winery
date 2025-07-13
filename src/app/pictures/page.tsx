import Link from 'next/link';

export default function PicturesPage() {
  // Mock image data - replace with real images
  const galleryImages = [
    { id: 1, src: '/api/placeholder/400/300', alt: 'Vineyard at sunrise', category: 'Vineyard' },
    { id: 2, src: '/api/placeholder/400/300', alt: 'Wine barrels in cellar', category: 'Cellar' },
    { id: 3, src: '/api/placeholder/400/300', alt: 'Grape harvest', category: 'Harvest' },
    { id: 4, src: '/api/placeholder/400/300', alt: 'Wine tasting room', category: 'Tasting Room' },
    { id: 5, src: '/api/placeholder/400/300', alt: 'Historic winery building', category: 'Architecture' },
    { id: 6, src: '/api/placeholder/400/300', alt: 'Wine bottles aging', category: 'Cellar' },
    { id: 7, src: '/api/placeholder/400/300', alt: 'Vineyard workers', category: 'Harvest' },
    { id: 8, src: '/api/placeholder/400/300', alt: 'Sunset over vines', category: 'Vineyard' },
    { id: 9, src: '/api/placeholder/400/300', alt: 'Wine glasses on patio', category: 'Tasting Room' },
    { id: 10, src: '/api/placeholder/400/300', alt: 'Stone entrance gate', category: 'Architecture' },
    { id: 11, src: '/api/placeholder/400/300', alt: 'Grape clusters on vine', category: 'Vineyard' },
    { id: 12, src: '/api/placeholder/400/300', alt: 'Wine cellar tours', category: 'Cellar' },
  ];

  const categories = ['All', 'Vineyard', 'Cellar', 'Harvest', 'Tasting Room', 'Architecture'];

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
              <Link href="/our-story" className="text-gray-600 hover:text-gray-900">Our Story</Link>
              <Link href="/wine-club" className="text-gray-600 hover:text-gray-900">Wine Club</Link>
              <Link href="/pictures" className="text-blue-600 font-semibold">Pictures</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Gallery</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Take a visual journey through our vineyard, winery, and the passionate craftsmanship 
            behind every bottle of Valley Oak wine.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {galleryImages.map((image) => (
            <div key={image.id} className="group relative overflow-hidden rounded-lg shadow-lg bg-white">
              <div className="aspect-w-4 aspect-h-3">
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition duration-300 flex items-end">
                <div className="w-full p-4 text-white transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-300">
                  <p className="font-medium">{image.alt}</p>
                  <p className="text-sm opacity-75">{image.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Featured Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-64 bg-gray-200 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Virtual Vineyard Tour</h3>
              <p className="text-gray-600 mb-4">
                Take a virtual walk through our vineyard and learn about our sustainable growing practices 
                and the unique terroir that makes our wines special.
              </p>
              <button className="text-blue-600 font-semibold hover:text-blue-800 transition duration-200">
                Watch Tour →
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-64 bg-gray-200 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Harvest Season 2024</h3>
              <p className="text-gray-600 mb-4">
                Experience the excitement and hard work of harvest season through our photo collection 
                from this year&apos;s grape harvest and crush.
              </p>
              <button className="text-blue-600 font-semibold hover:text-blue-800 transition duration-200">
                View Album →
              </button>
            </div>
          </div>
        </div>

        {/* Visit Us CTA */}
        <div className="bg-blue-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Visit Us in Person</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Pictures tell a story, but nothing compares to experiencing our vineyard in person. 
            Book a tasting and tour to create your own memories.
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200">
            Schedule a Visit
          </button>
        </div>
      </main>
    </div>
  );
}
