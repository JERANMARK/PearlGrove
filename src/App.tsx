import { lazy, Suspense, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Admin Components
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';

const Home = lazy(() => import('./pages/Home'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((module) => ({ default: module.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts').then((module) => ({ default: module.AdminProducts })));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm').then((module) => ({ default: module.AdminProductForm })));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories').then((module) => ({ default: module.AdminCategories })));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders').then((module) => ({ default: module.AdminOrders })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then((module) => ({ default: module.AdminSettings })));

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-gray-600 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AdminAuthProvider>
          <Suspense fallback={
            <div role="status" className="min-h-screen flex items-center justify-center" aria-busy="true" aria-live="polite">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading page…</p>
              </div>
            </div>
          }>
            <Routes>
              {/* Customer Facing Website */}
              <Route path="/" element={<Home />} />

              {/* Admin Login */}
              <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Admin Panel */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/add" element={<AdminProductForm />} />
                <Route path="products/edit/:id" element={<AdminProductForm />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Fallback to Customer Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AdminAuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
