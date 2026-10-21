import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, resolveApiImageUrl } from '../../services/api';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalProducts: number;
    activeProducts: number;
    outOfStock: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalCategories?: number;
  };
  recentProducts: any[];
  recentOrders: any[];
}

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getDashboardStats();
      if (res.success && res.stats) {
        setData({
          stats: res.stats,
          recentProducts: res.recentProducts || [],
          recentOrders: res.recentOrders || [],
        });
      } else {
        // Fallback default state for initial setup
        setData({
          stats: {
            totalProducts: 6,
            activeProducts: 6,
            outOfStock: 0,
            totalOrders: 0,
            pendingOrders: 0,
            completedOrders: 0,
            totalCategories: 4,
          },
          recentProducts: [],
          recentOrders: [],
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-medium">Loading Pearl Grow dashboard data...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Products',
      value: data?.stats.totalProducts ?? 0,
      icon: Package,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      link: '/admin/products',
    },
    {
      title: 'Active Products',
      value: data?.stats.activeProducts ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      link: '/admin/products',
    },
    {
      title: 'Out of Stock',
      value: data?.stats.outOfStock ?? 0,
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      link: '/admin/products',
    },
    {
      title: 'Total Orders',
      value: data?.stats.totalOrders ?? 0,
      icon: ShoppingBag,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      link: '/admin/orders',
    },
    {
      title: 'Pending Inquiries',
      value: data?.stats.pendingOrders ?? 0,
      icon: Clock,
      color: 'text-orange-600 bg-orange-50 border-orange-100',
      link: '/admin/orders',
    },
    {
      title: 'Completed Orders',
      value: data?.stats.completedOrders ?? 0,
      icon: CheckCircle,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
      link: '/admin/orders',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pearl Grove Operations Overview</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time catalog metrics and incoming supply inquiries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            title="Refresh Data"
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/admin/products/add"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-slate-500 truncate">{card.title}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{card.value}</div>
            </Link>
          );
        })}
      </div>

      {/* Tables Row: Recent Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Products */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Products</h3>
              <p className="text-[11px] text-slate-500">Latest additions to catalog</p>
            </div>
            <Link
              to="/admin/products"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {data?.recentProducts && data.recentProducts.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentProducts.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <img
                          src={resolveApiImageUrl(p.image)}
                          alt={p.name}
                          className="w-8 h-8 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/Radish.jpg';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{p.category?.name || 'Microgreen'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        Rs. {p.price?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {p.stock} units
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {p.isAvailable ? 'Available' : 'Disabled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No recent products found in database.
              </div>
            )}
          </div>
        </div>

        {/* Recent Inquiries & Orders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Supply Inquiries & Orders</h3>
              <p className="text-[11px] text-slate-500">Customer requests and WhatsApp checkouts</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Items / Note</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{o.customerName}</p>
                        <p className="text-[10px] text-slate-400">{o.businessType || 'Customer'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                        {o.customerPhone}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-[160px] truncate">
                        {o.selectedVarieties || (o.orderItems?.length ? `${o.orderItems.length} item(s)` : 'General enquiry')}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            o.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : o.status === 'CONFIRMED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : o.status === 'PROCESSING'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : o.status === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No orders or inquiries recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
