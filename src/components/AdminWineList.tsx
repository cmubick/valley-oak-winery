// components/AdminWineList.tsx
'use client';

import { Wine } from '@/lib/dynamodb';
import { Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface AdminWineListProps {
  wines: Wine[];
  onEdit: (wine: Wine) => void;
  onDelete: (id: string) => void;
}

export default function AdminWineList({ wines, onEdit, onDelete }: AdminWineListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      // Auto-cancel after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (wines.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No wines added yet</div>
        <p className="text-gray-400 mt-2">Click &quot;Add New Wine&quot; to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {wines.map((wine) => (
              <tr key={wine.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16">
                      {wine.imageUrl ? (
                        <Image
                          src={wine.imageUrl}
                          alt={wine.name}
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {wine.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {wine.vintage}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{wine.varietal}</div>
                  <div className="text-sm text-gray-500">{wine.region}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ${wine.price.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    wine.inStock
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {wine.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(wine)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="Edit wine"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(wine.id)}
                      className={`p-1 rounded ${
                        deleteConfirm === wine.id
                          ? 'text-red-800 bg-red-100 hover:bg-red-200'
                          : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                      }`}
                      title={deleteConfirm === wine.id ? 'Click again to confirm' : 'Delete wine'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
