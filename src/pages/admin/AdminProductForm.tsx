import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { adminApi, resolveApiImageUrl } from '../../services/api';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Radish', path: '/images/Radish.jpg' },
  { label: 'Pea Shoots', path: '/images/Pea Shoots.jpg' },
  { label: 'Sunflower', path: '/images/Sunflower.jpg' },
  { label: 'Broccoli', path: '/images/Broccoli.jpg' },
  { label: 'Red Cabbage', path: '/images/Red Cabbage.jpg' },
  { label: 'Mustard', path: '/images/Mustard.png' },
];

const PRODUCT_TEMPLATES = [
  {
    name: 'Radish',
    notes: 'Peppery • Crisp • Vibrant',
    description: 'Radish microgreens bring a fresh, peppery character and attractive appearance to dishes. They are ideal for garnishing, salads, sandwiches and creative restaurant plating.',
    profile: ['Peppery'],
    usage: ['Salads', 'Sandwiches', 'Restaurant plating', 'Modern culinary creations'],
    image: '/images/Radish.jpg',
  },
  {
    name: 'Pea Shoots',
    notes: 'Sweet • Fresh • Crisp',
    description: 'Tender shoots with a naturally fresh pea flavour and appealing texture. They are excellent for salads, sandwiches, bowls, garnishes and plated dishes.',
    profile: ['Sweet'],
    usage: ['Salads', 'Sandwiches', 'Bowls', 'Garnishes', 'Restaurant plating'],
    image: '/images/Pea Shoots.jpg',
  },
  {
    name: 'Sunflower',
    notes: 'Crunchy • Fresh • Substantial',
    description: 'Sunflower microgreens offer larger, crisp leaves and a satisfying texture, making them suitable for salads, sandwiches, bowls and modern healthy meals.',
    profile: ['Mild'],
    usage: ['Salads', 'Sandwiches', 'Bowls', 'Healthy meals'],
    image: '/images/Sunflower.jpg',
  },
  {
    name: 'Broccoli',
    notes: 'Mild • Delicate • Versatile',
    description: 'A mild and versatile microgreen with a familiar fresh character. It is suitable for a wide range of salads, garnishes and everyday dishes.',
    profile: ['Mild'],
    usage: ['Salads', 'Garnishes', 'Healthy meals', 'Bowls'],
    image: '/images/Broccoli.jpg',
  },
  {
    name: 'Red Cabbage',
    notes: 'Colourful • Delicate • Elegant',
    description: 'Known for its attractive purple-red tones, Red Cabbage microgreens bring beautiful colour contrast and visual appeal to premium plating, salads and modern culinary creations.',
    profile: ['Colourful', 'Mild'],
    usage: ['Fine-dining garnishes', 'Salads', 'Restaurant plating', 'Modern culinary creations'],
    image: '/images/Red Cabbage.jpg',
  },
  {
    name: 'Mustard',
    notes: 'Bold • Peppery • Distinctive',
    description: 'Mustard microgreens offer a stronger, spicy character, making them an excellent choice for chefs looking to add extra flavour and personality to a dish.',
    profile: ['Peppery'],
    usage: ['Fine-dining dishes', 'Salads', 'Sandwiches', 'Modern culinary creations'],
    image: '/images/Mustard.png',
  },
];

const FLAVOR_OPTIONS = ['Mild', 'Sweet', 'Peppery', 'Colourful', 'Zesty', 'Nutty', 'Earthy'];
const USAGE_OPTIONS = [
  'Salads',
  'Sandwiches',
  'Bowls',
  'Restaurant plating',
  'Fine-dining garnishes',
  'Healthy meals',
  'Café dishes',
  'Modern culinary creations',
];

const parseMoneyInput = (value: string): number | null => {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= 999_999_999_999 ? cents / 100 : null;
};

export const AdminProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('50');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('/images/Radish.jpg');
  const [customImage, setCustomImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(['Mild']);
  const [selectedUsages, setSelectedUsages] = useState<string[]>(['Salads', 'Bowls']);

  useEffect(() => {
    const init = async () => {
      try {
        const catRes = await adminApi.getCategories();
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
          if (!isEditMode && catRes.data.length > 0) {
            setCategoryId(catRes.data[0].id);
          }
        }

        if (isEditMode && id) {
          const prodRes = await adminApi.getProduct(id);
          if (prodRes.success && prodRes.data) {
            const p = prodRes.data;
            setName(p.name || '');
            setCategoryId(p.categoryId || '');
            setPrice(String(p.price ?? ''));
            setDiscountPrice(p.discountPrice === null || p.discountPrice === undefined ? '' : String(p.discountPrice));
            setStock(String(p.stock ?? 0));
            setIsAvailable(p.isAvailable !== false);
            setIsFeatured(Boolean(p.isFeatured));
            setNotes(p.notes || '');
            setDescription(p.description || '');
            setImage(p.image || '/images/Radish.jpg');

            if (p.profile) {
              const profs = p.profile.split(',').map((s: string) => s.trim());
              setSelectedProfiles(profs);
            }
            if (p.bestSuitedFor) {
              const usages = p.bestSuitedFor.split(',').map((s: string) => s.trim());
              setSelectedUsages(usages);
            }
          } else {
            setErrorMessage('Could not load product details.');
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error loading form data.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, isEditMode]);

  const toggleProfile = (prof: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(prof) ? prev.filter((p) => p !== prof) : [...prev, prof]
    );
  };

  const toggleUsage = (usage: string) => {
    setSelectedUsages((prev) =>
      prev.includes(usage) ? prev.filter((u) => u !== usage) : [...prev, usage]
    );
  };

  const applyProductTemplate = (template: typeof PRODUCT_TEMPLATES[number]) => {
    setName(template.name);
    setNotes(template.notes);
    setDescription(template.description);
    setImage(template.image);
    setCustomImage(false);
    setSelectedProfiles(template.profile);
    setSelectedUsages(template.usage);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side file size validation (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setImageUploadError('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setImageUploadError('Only JPG, PNG, and WEBP images are allowed.');
      return;
    }

    setUploadingImage(true);
    setImageUploadError(null);

    try {
      const result = await adminApi.uploadProductImage(file);
      if (!result.success || !result.data?.imageUrl) {
        setImageUploadError(result.error || 'Image upload failed.');
        return;
      }

      setImage(result.data.imageUrl);
      setCustomImage(true);
    } catch (error: any) {
      setImageUploadError(error.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Product name is required.');
      return;
    }

    const parsedPrice = parseMoneyInput(price);
    const parsedDiscountPrice = discountPrice.trim() ? parseMoneyInput(discountPrice) : null;
    const stockValue = stock.trim();
    const parsedStock = Number(stockValue);

    if (parsedPrice === null) {
      setErrorMessage('Please enter a valid price.');
      return;
    }

    if (discountPrice.trim() && parsedDiscountPrice === null) {
      setErrorMessage('Please enter a valid discount price with no more than two decimal places.');
      return;
    }

    if (parsedDiscountPrice !== null && parsedDiscountPrice >= parsedPrice) {
      setErrorMessage('Discount price must be lower than the regular price.');
      return;
    }

    if (!/^\d+$/.test(stockValue) || !Number.isSafeInteger(parsedStock) || parsedStock > 100_000_000) {
      setErrorMessage('Stock must be a whole number between 0 and 100,000,000.');
      return;
    }

    const payload = {
      name: name.trim(),
      categoryId: categoryId || null,
      price: parsedPrice,
      discountPrice: parsedDiscountPrice,
      stock: parsedStock,
      isAvailable,
      isFeatured,
      notes: notes.trim(),
      description: description.trim(),
      image: image.trim(),
      profile: selectedProfiles.join(', '),
      bestSuitedFor: selectedUsages.join(', '),
    };

    setSaving(true);
    try {
      const res = isEditMode && id
        ? await adminApi.updateProduct(id, payload)
        : await adminApi.createProduct(payload);

      if (res.success) {
        navigate('/admin/products');
      } else {
        setErrorMessage(res.error || 'Failed to save product.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with server.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-medium">Loading product form...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEditMode ? `Edit Product: ${name || 'Variety'}` : 'Add New Microgreen Variety'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditMode
                ? 'Update pricing, availability, and presentation details'
                : 'Enter specifications for the new Pearl Grow catalog item'}
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info (2 Cols) */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
                General Information
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Radish, Pea Shoots, Sunflower"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800"
                >
                  <option value="">No Category Assigned</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Flavor Notes / Subtitle
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Peppery, Crisp, Vibrant"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of taste, texture, and harvest characteristics..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                />
              </div>
            </div>

            {/* Flavor Profile & Usages */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
                Flavor Profiles & Culinary Pairings
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Flavor Profile Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {FLAVOR_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => toggleProfile(opt)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selectedProfiles.includes(opt)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Best Suited For (Dishes / Applications)
                </label>
                <div className="flex flex-wrap gap-2">
                  {USAGE_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => toggleUsage(opt)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selectedUsages.includes(opt)
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing, Stock & Image (1 Col) */}
          <div className="space-y-6">
            {/* Pricing & Stock Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
                Pricing & Inventory
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price (Rs.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1500"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discount Price (Rs.) (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="Leave empty if no discount"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stock Units (Available Harvest)
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="50"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Active / Available for orders
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Feature on Homepage Starter Collection
                  </span>
                </label>
              </div>
            </div>

            {/* Product Image Selection Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Product Image</span>
                <ImageIcon className="w-4 h-4 text-slate-400" />
              </h3>

              {/* Preview */}
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={resolveApiImageUrl(image)}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/Radish.jpg';
                  }}
                />
              </div>

              {/* Product templates */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Quick-add product templates:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRODUCT_TEMPLATES.map((template) => (
                    <button
                      type="button"
                      key={template.name}
                      onClick={() => applyProductTemplate(template)}
                      className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-left hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                    >
                      <div className="font-semibold text-slate-800">{template.name}</div>
                      <div className="text-slate-500 mt-0.5">{template.notes}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Select from Pearl Grow Asset Library:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      type="button"
                      key={preset.path}
                      onClick={() => {
                        setImage(preset.path);
                        setCustomImage(false);
                      }}
                      className={`p-1 rounded-lg border text-[10px] text-center transition-all ${
                        image === preset.path && !customImage
                          ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload custom image from device */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Upload from your photos:
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleImageUpload}
                  className="block w-full text-[11px] text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:text-[11px] file:font-semibold hover:file:bg-emerald-700"
                />
                {uploadingImage && (
                  <p className="text-[10px] text-emerald-700 font-medium">Uploading image...</p>
                )}
                {imageUploadError && (
                  <p className="text-[10px] text-red-600 font-medium">{imageUploadError}</p>
                )}
              </div>

              {/* Custom Image URL Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Or Custom Image URL:
                </label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => {
                    setImage(e.target.value);
                    setCustomImage(true);
                  }}
                  placeholder="/images/example.jpg or https://..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            to="/admin/products"
            className="py-2.5 px-5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="py-2.5 px-6 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Product...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isEditMode ? 'Update Product' : 'Create Product'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
