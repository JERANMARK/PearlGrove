// API Service configuration and helper functions

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const isValidProductionApiUrl = (() => {
  if (!configuredApiUrl) return false;
  try {
    const parsed = new URL(configuredApiUrl);
    const localHost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) || parsed.hostname.endsWith('.localhost');
    return parsed.protocol === 'https:' && parsed.pathname.replace(/\/$/, '') === '/api' && !parsed.search && !parsed.hash && !parsed.username && !parsed.password && !localHost;
  } catch { return false; }
})();
if (import.meta.env.PROD && !isValidProductionApiUrl) {
  throw new Error('VITE_API_URL must be the HTTPS production API origin ending in /api.');
}
const API_BASE = (configuredApiUrl || 'http://localhost:5000/api').replace(/\/$/, '');
export const resolveApiImageUrl = (value?: string | null) => {
  if (!value) return '/images/Radish.jpg';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/images/uploads/')) return `${API_BASE.replace(/\/api$/i, '')}${value}`;
  return value;
};

// Helper for authorized headers
export const getAuthHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
  };
};

const normalizeMoneyValues = (value: any): any => {
  if (Array.isArray(value)) return value.map(normalizeMoneyValues);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => {
    if (['price', 'discountPrice', 'totalAmount', 'subtotal'].includes(key) && typeof child === 'string' && /^\d+(\.\d+)?$/.test(child)) {
      return [key, Number(child)];
    }
    return [key, normalizeMoneyValues(child)];
  }));
};

// Generic fetch wrapper with error handling
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; [key: string]: any }> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers, credentials: 'include' });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && !endpoint.includes('/login')) {
        // Clear cached identity and let the auth provider return to login.
        localStorage.removeItem('pearl_admin_user');
        window.dispatchEvent(new Event('pearl-admin-session-expired'));
      }
      return {
        success: false,
        error: data.error || `Request failed with status ${res.status}`,
      };
    }

    return normalizeMoneyValues(data);
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error. Server may be offline.',
    };
  }
}

// ----------------- Public Customer APIs -----------------
type CustomerOrderPayload = {
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  businessType?: string;
  message?: string;
  selectedVarieties?: string[];
  items?: Array<{ productId: string; quantity: number }>;
};

export const customerApi = {
  // Get all active products
  getProducts: async (params?: { category?: string; search?: string; availableOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.availableOnly) query.append('availableOnly', 'true');
    
    return apiFetch<any[]>(`/products?${query.toString()}`);
  },

  // Get single product
  getProduct: async (id: string) => {
    return apiFetch<any>(`/products/${id}`);
  },

  // Get categories
  getCategories: async () => {
    return apiFetch<any[]>('/categories');
  },

  // Get public settings (e.g. WhatsApp number)
  getSettings: async () => {
    return apiFetch<any>('/settings/public');
  },

  // Create order / enquiry
  createOrder: async (orderData: CustomerOrderPayload, idempotencyKey: string) => {
    return apiFetch<any>('/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(orderData),
    });
  },
};

export const submitCustomerOrder = async (
  orderData: CustomerOrderPayload,
  storageSlot: string,
  pendingKeys: Map<string, string>,
) => {
  const fingerprint = JSON.stringify(orderData);
  let idempotencyKey = pendingKeys.get(fingerprint);
  if (!idempotencyKey) {
    try { idempotencyKey = sessionStorage.getItem(storageSlot) || undefined; } catch { /* in-memory fallback */ }
  }
  idempotencyKey ||= crypto.randomUUID();
  pendingKeys.set(fingerprint, idempotencyKey);
  try { sessionStorage.setItem(storageSlot, idempotencyKey); } catch { /* in-memory fallback */ }

  let result = await customerApi.createOrder(orderData, idempotencyKey);
  if (!result.success && result.error === 'This Idempotency-Key was already used with a different request.') {
    // The old key belongs to a different draft; only the explicit hash conflict permits rotating it.
    idempotencyKey = crypto.randomUUID();
    pendingKeys.set(fingerprint, idempotencyKey);
    try { sessionStorage.setItem(storageSlot, idempotencyKey); } catch { /* in-memory fallback */ }
    result = await customerApi.createOrder(orderData, idempotencyKey);
  }
  if (result.success) {
    pendingKeys.delete(fingerprint);
    try {
      if (sessionStorage.getItem(storageSlot) === idempotencyKey) sessionStorage.removeItem(storageSlot);
    } catch { /* in-memory fallback */ }
  }
  return result;
};

// ----------------- Admin APIs -----------------
export const adminApi = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    return apiFetch<{ token: string; admin: any }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout: async () => {
    return apiFetch<any>('/admin/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  getMe: async () => {
    return apiFetch<{ id: string; email: string; createdAt: string }>('/admin/me', {
      headers: getAuthHeaders(),
    });
  },

  updatePassword: async (passwords: { currentPassword: string; newPassword: string }) => {
    return apiFetch<any>('/admin/password', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwords),
    });
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    return apiFetch<{
      stats: {
        totalProducts: number;
        activeProducts: number;
        outOfStock: number;
        totalOrders: number;
        pendingOrders: number;
        completedOrders: number;
        totalCategories: number;
      };
      recentProducts: any[];
      recentOrders: any[];
    }>('/admin/dashboard', {
      headers: getAuthHeaders(),
    });
  },

  // Products CRUD
  getProducts: async (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    return apiFetch<any[]>(`/admin/products?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
  },

  getProduct: async (id: string) => {
    return apiFetch<any>(`/admin/products/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  uploadProductImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/admin/upload-image`, {
      method: 'POST',
      headers: {
      },
      body: formData,
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Image upload failed.',
      };
    }

    return data;
  },

  createProduct: async (productData: any) => {
    return apiFetch<any>('/admin/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
  },

  updateProduct: async (id: string, productData: any) => {
    return apiFetch<any>(`/admin/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
  },

  toggleProductAvailability: async (id: string) => {
    return apiFetch<any>(`/admin/products/${id}/toggle-availability`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  },

  deleteProduct: async (id: string) => {
    return apiFetch<any>(`/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // Categories CRUD
  getCategories: async () => {
    return apiFetch<any[]>('/admin/categories', {
      headers: getAuthHeaders(),
    });
  },

  createCategory: async (categoryData: { name: string; description?: string }) => {
    return apiFetch<any>('/admin/categories', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData),
    });
  },

  updateCategory: async (id: string, categoryData: { name: string; description?: string }) => {
    return apiFetch<any>(`/admin/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData),
    });
  },

  deleteCategory: async (id: string) => {
    return apiFetch<any>(`/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // Orders Management
  getOrders: async (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return apiFetch<any[]>(`/admin/orders?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
  },

  getOrder: async (id: string) => {
    return apiFetch<any>(`/admin/orders/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  updateOrderStatus: async (id: string, status: string) => {
    return apiFetch<any>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
  },

  deleteOrder: async (id: string) => {
    return apiFetch<any>(`/admin/orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // Settings
  getSettings: async () => {
    return apiFetch<any>('/admin/settings', {
      headers: getAuthHeaders(),
    });
  },

  updateSettings: async (settingsData: Record<string, string>) => {
    return apiFetch<any>('/admin/settings', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settingsData),
    });
  },
};
