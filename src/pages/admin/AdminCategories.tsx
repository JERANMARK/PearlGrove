import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Package,
} from 'lucide-react';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Failed to fetch categories.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: 'error', text: 'Category name is required.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = { name: name.trim(), description: description.trim() };
      const res = editingCategory
        ? await adminApi.updateCategory(editingCategory.id, payload)
        : await adminApi.createCategory(payload);

      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Category "${name}" ${editingCategory ? 'updated' : 'created'} successfully.`,
        });
        setModalOpen(false);
        fetchCategories();
      } else {
        setFeedback({ type: 'error', text: res.error || 'Operation failed.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error communicating with server.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    // Protection rule check
    if (categoryToDelete._count?.products > 0) {
      setFeedback({
        type: 'error',
        text: `Cannot delete category "${categoryToDelete.name}" because it still contains ${categoryToDelete._count.products} assigned product(s). Please reassign or delete the products first.`,
      });
      setCategoryToDelete(null);
      return;
    }

    setDeleting(true);
    try {
      const res = await adminApi.deleteCategory(categoryToDelete.id);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Category "${categoryToDelete.name}" was deleted successfully.`,
        });
        setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
        setCategoryToDelete(null);
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to delete category.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error during deletion.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Category Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Organize produce into collections (Microgreens, Specialty Greens, Edible Flowers, Herbs)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            title="Refresh Categories"
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-lg text-xs font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-70 text-slate-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mb-2" />
            <p className="text-xs font-medium">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-semibold text-slate-700">No categories created yet</p>
            <p className="text-xs text-slate-400 mt-1">Start by adding your first product category.</p>
            <button
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-2 bg-emerald-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Category Name</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Assigned Products</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => {
                  const productCount = cat._count?.products ?? 0;
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-emerald-600" />
                        <span>{cat.name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-md">
                        {cat.description || <span className="text-slate-300 italic">No description</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                            productCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Package className="w-3 h-3" />
                          {productCount} {productCount === 1 ? 'variety' : 'varieties'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            title="Edit Category"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCategoryToDelete(cat)}
                            title="Delete Category"
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. Microgreens, Gourmet Herbs"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  placeholder="Brief description for internal organization and culinary reference..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2 px-5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Safety Check */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Confirm Category Deletion
              </h3>
              {categoryToDelete._count?.products > 0 ? (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="font-semibold">⚠️ Deletion Prohibited</p>
                  <p className="mt-1">
                    "{categoryToDelete.name}" currently contains{' '}
                    <strong>{categoryToDelete._count.products}</strong> active product(s). You must reassign or delete those products before deleting this category.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-2">
                  Are you sure you want to permanently delete category{' '}
                  <span className="font-semibold text-slate-800">
                    "{categoryToDelete.name}"
                  </span>
                  ?
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                {categoryToDelete._count?.products > 0 ? 'Close' : 'Cancel'}
              </button>
              {categoryToDelete._count?.products === 0 && (
                <button
                  type="button"
                  onClick={handleDeleteCategory}
                  disabled={deleting}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Category</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
