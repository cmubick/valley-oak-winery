import { Wine } from '@/lib/dynamodb';
import Image from 'next/image';

interface WineCardProps {
  wine: Wine;
}

export default function WineCard({ wine }: WineCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {wine.imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={wine.imageUrl}
            alt={wine.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {wine.name} {wine.vintage}
        </h3>
        <p className="text-gray-600 mb-2">{wine.varietal} • {wine.region}</p>
        <p className="text-gray-700 mb-4">{wine.description}</p>
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-1">Tasting Notes:</h4>
          <p className="text-gray-600 text-sm">{wine.tastingNotes}</p>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-gray-900">${wine.price}</span>
          <span className={`px-2 py-1 rounded text-sm ${
            wine.inStock 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {wine.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
    </div>
  );
}
