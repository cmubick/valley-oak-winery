'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wine } from '@/lib/dynamodb';
import { X, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';

// Validation schema
const wineSchema = z.object({
  name: z.string().min(1, 'Wine name is required'),
  vintage: z.number().min(1900, 'Vintage must be after 1900').max(new Date().getFullYear(), 'Vintage cannot be in the future'),
  varietal: z.string().min(1, 'Varietal is required'),
  region: z.string().min(1, 'Region is required'),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  tastingNotes: z.string().min(10, 'Tasting notes must be at least 10 characters'),
  inStock: z.boolean(),
});

type WineFormData = z.infer<typeof wineSchema>;

interface WineFormProps {
  wine?: Wine | null;
  onSubmit: (data: WineFormData & { imageUrl?: string }) => Promise<void>;
  onCancel: () => void;
}

// Common wine varietals for dropdown
const VARIETALS = [
  'Cabernet Sauvignon',
  'Merlot',
  'Pinot Noir',
  'Chardonnay',
  'Sauvignon Blanc',
  'Riesling',
  'Syrah/Shiraz',
  'Zinfandel',
  'Pinot Grigio',
  'Gewürztraminer',
  'Malbec',
  'Tempranillo',
  'Sangiovese',
  'Chenin Blanc',
  'Viognier',
  'Blend',
  'Other',
];

export default function WineForm({ wine, onSubmit, onCancel }: WineFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WineFormData>({
    resolver: zodResolver(wineSchema),
    defaultValues: {
      name: '',
      vintage: new Date().getFullYear(),
      varietal: '',
      region: '',
      price: 0,
      description: '',
      tastingNotes: '',
      inStock: true,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (wine) {
      reset({
        name: wine.name,
        vintage: wine.vintage,
        varietal: wine.varietal,
        region: wine.region,
        price: wine.price,
        description: wine.description,
        tastingNotes: wine.tastingNotes,
        inStock: wine.inStock,
      });
      setImagePreview(wine.imageUrl || null);
    }
  }, [wine, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setUploadingImage(true);
    try {
      // Get presigned URL for upload
      const response = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: imageFile.name,
          fileType: imageFile.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, imageUrl } = await response.json();

      // Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: imageFile,
        headers: {
          'Content-Type': imageFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const onFormSubmit = async (data: WineFormData) => {
    setIsSubmitting(true);
    try {
      let imageUrl = wine?.imageUrl || null;

      // Upload new image if selected
      if (imageFile) {
        const uploadedImageUrl = await uploadImage();
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      }

      await onSubmit({
        ...data,
        imageUrl: imageUrl || undefined,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {wine ? 'Edit Wine' : 'Add New Wine'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wine Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wine Name *
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter wine name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Vintage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vintage *
              </label>
              <input
                type="number"
                {...register('vintage', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2023"
              />
              {errors.vintage && (
                <p className="text-red-500 text-sm mt-1">{errors.vintage.message}</p>
              )}
            </div>

            {/* Varietal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Varietal *
              </label>
              <select
                {...register('varietal')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select varietal</option>
                {VARIETALS.map((varietal) => (
                  <option key={varietal} value={varietal}>
                    {varietal}
                  </option>
                ))}
              </select>
              {errors.varietal && (
                <p className="text-red-500 text-sm mt-1">{errors.varietal.message}</p>
              )}
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region *
              </label>
              <input
                type="text"
                {...register('region')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Napa Valley, CA"
              />
              {errors.region && (
                <p className="text-red-500 text-sm mt-1">{errors.region.message}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="29.99"
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
              )}
            </div>

            {/* In Stock */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('inStock')}
                id="inStock"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="inStock" className="text-sm font-medium text-gray-700">
                In Stock
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the wine..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Tasting Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasting Notes *
            </label>
            <textarea
              {...register('tastingNotes')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed tasting notes including aroma, flavor, and finish..."
            />
            {errors.tastingNotes && (
              <p className="text-red-500 text-sm mt-1">{errors.tastingNotes.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wine Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 relative">
              {imagePreview ? (
                <>
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={600}
                    height={192}
                    className="w-full h-48 object-cover rounded-lg"
                    style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Choose Image
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {(isSubmitting || uploadingImage) && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span>
                {isSubmitting || uploadingImage
                  ? 'Saving...'
                  : wine
                  ? 'Update Wine'
                  : 'Add Wine'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
