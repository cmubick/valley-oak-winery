'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Wine } from '@/lib/dynamodb';
import WineForm from '@/components/WineForm';
import AdminWineList from '@/components/AdminWineList';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wines, setWines] = useState<Wine[]>([]);
  const [editingWine, setEditingWine] = useState<Wine | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/admin/login');
      return;
    }
    fetchWines();
  }, [session, status, router]);

  const fetchWines = async () => {
    try {
      const res = await fetch('/api/wines');
      if (res.ok) {
        const data = await res.json();
        setWines(data);
      }
    } catch (error) {
      console.error('Error fetching wines:', error);
    }
  };

  const handleWineSubmit = async (wineData: Partial<Wine>) => {
    try {
      const url = editingWine ? `/api/wines/${editingWine.id}` : '/api/wines';
      const method = editingWine ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wineData),
      });

      if (res.ok) {
        await fetchWines();
        setShowForm(false);
        setEditingWine(null);
      }
    } catch (error) {
      console.error('Error saving wine:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/wines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchWines();
      }
    } catch (error) {
      console.error('Error deleting wine:', error);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Wine Admin Dashboard
            </h1>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add New Wine
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm && (
          <WineForm
            wine={editingWine}
            onSubmit={handleWineSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingWine(null);
            }}
          />
        )}
        
        <AdminWineList
          wines={wines}
          onEdit={(wine) => {
            setEditingWine(wine);
            setShowForm(true);
          }}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
