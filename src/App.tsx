import { lazy, Suspense } from 'react';
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

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Suspense fallback={<div role="status" className="p-6 text-center">Loading page…</div>}>
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
  );
}

export default App;
