'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { WINE_COLLECTIONS, WINE_STYLES, Wine, WineInput, wineInputSchema } from '@/lib/wines';

interface WineFormProps {
  wine?: Wine | null;
  nextSortOrder: number;
  onSubmit: (data: WineInput) => Promise<void>;
  onCancel: () => void;
}

const input = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
const label = 'block text-sm font-medium text-gray-700 mb-1';
const optionalNumber = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : Number(v));
const optionalString = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-red-500 text-sm mt-1">{message}</p> : null;
}

export default function WineForm({ wine, nextSortOrder, onSubmit, onCancel }: WineFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WineInput>({
    resolver: zodResolver(wineInputSchema),
    defaultValues: {
      name: '',
      vintage: new Date().getFullYear(),
      collection: 'ubick-reserve',
      style: 'red',
      award: '',
      price: 0,
      description: '',
      inStock: true,
      sortOrder: nextSortOrder,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (wine) {
      reset({
        name: wine.name,
        vintage: wine.vintage,
        collection: wine.collection,
        style: wine.style,
        award: wine.award ?? '',
        price: wine.price,
        description: wine.description,
        inStock: wine.inStock,
        sortOrder: wine.sortOrder,
      });
      setImagePreview(wine.imageUrl || null);
    }
  }, [wine, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: imageFile.name, fileType: imageFile.type }),
      });
      if (!response.ok) throw new Error('Failed to get upload URL');

      const { uploadUrl, imageUrl } = await response.json();

      // Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: imageFile,
        headers: { 'Content-Type': imageFile.type },
      });
      if (!uploadResponse.ok) throw new Error('Failed to upload image');

      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const onFormSubmit = async (data: WineInput) => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      // Keep the existing image unless it was removed or replaced
      let imageUrl = imagePreview ? wine?.imageUrl : undefined;
      if (imageFile) {
        const uploaded = await uploadImage();
        if (!uploaded) {
          setSubmitError('Image upload failed. Try again or remove the image.');
          return;
        }
        imageUrl = uploaded;
      }
      await onSubmit({ ...data, imageUrl });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('Could not save the wine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto mb-20 p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{wine ? 'Edit Wine' : 'Add New Wine'}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={label}>Name *</label>
              <input type="text" {...register('name')} className={input} placeholder="Sangiovese" />
              <FieldError message={errors.name?.message} />
            </div>

            <div>
              <label className={label}>Vintage</label>
              <input
                type="number"
                {...register('vintage', { setValueAs: optionalNumber })}
                className={input}
                placeholder="Leave blank for non-vintage"
              />
              <FieldError message={errors.vintage?.message} />
            </div>

            <div>
              <label className={label}>Label *</label>
              <select {...register('collection')} className={input}>
                {WINE_COLLECTIONS.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <FieldError message={errors.collection?.message} />
            </div>

            <div>
              <label className={label}>Style *</label>
              <select {...register('style')} className={input}>
                {WINE_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
              <FieldError message={errors.style?.message} />
            </div>

            <div>
              <label className={label}>Award</label>
              <input
                type="text"
                {...register('award', { setValueAs: optionalString })}
                className={input}
                placeholder="Bronze Medal – CA State Fair"
              />
              <FieldError message={errors.award?.message} />
            </div>

            <div>
              <label className={label}>Price ($) *</label>
              <input type="number" step="0.01" {...register('price', { valueAsNumber: true })} className={input} />
              <FieldError message={errors.price?.message} />
            </div>

            <div>
              <label className={label}>Display order *</label>
              <input type="number" {...register('sortOrder', { valueAsNumber: true })} className={input} />
              <p className="text-gray-500 text-xs mt-1">Lower numbers appear first within the wine&apos;s label and style.</p>
              <FieldError message={errors.sortOrder?.message} />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('inStock')}
                id="inStock"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="inStock" className="text-sm font-medium text-gray-700">
                In stock (unchecked shows &quot;Sold Out&quot; instead of the price)
              </label>
            </div>
          </div>

          <div>
            <label className={label}>Description *</label>
            <textarea
              {...register('description')}
              rows={3}
              className={input}
              placeholder="Cherry bouquet plus Dried Fruit & light peppery finish."
            />
            <FieldError message={errors.description?.message} />
          </div>

          <div>
            <label className={label}>Bottle Photo (optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 relative">
              {imagePreview ? (
                <>
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={600}
                    height={192}
                    className="w-full h-48 object-contain rounded-lg"
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
                    <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {submitError && <p className="text-red-600 text-sm">{submitError}</p>}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {(isSubmitting || uploadingImage) && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting || uploadingImage ? 'Saving...' : wine ? 'Update Wine' : 'Add Wine'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
