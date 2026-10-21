import React, { useEffect, useState } from 'react';
import { adminApi, resolveApiImageUrl } from '../../services/api';
import {
  Search,
  MessageCircle,
  Eye,
  Loader2,
  RefreshCw,
  X,
  Calendar,
} from 'lucide-react';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED'];

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOrders({
        status: selectedStatus,
        search,
      });
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Failed to fetch orders.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatusId(orderId);
    try {
      const res = await adminApi.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        setFeedback({
          type: 'success',
          text: `Order status updated to ${newStatus}.`,
        });
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to update order status.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error updating order status.' });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PROCESSING':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Inquiries & Orders</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track customer supply requests, WhatsApp orders, and commercial kitchen supplies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            title="Refresh Orders"
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
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
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1 text-slate-500 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by customer, phone, or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        </form>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['ALL', ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mb-2" />
            <p className="text-xs font-medium">Loading orders & inquiries...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-semibold text-slate-700">No orders or inquiries found</p>
            <p className="text-xs text-slate-400 mt-1">Inquiries submitted via the customer site will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Order Ref & Date</th>
                  <th className="px-5 py-3.5">Customer & Phone</th>
                  <th className="px-5 py-3.5">Products / Varieties</th>
                  <th className="px-4 py-3.5">Total (Rs.)</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => {
                  const whatsappCleanPhone = o.customerPhone ? o.customerPhone.replace(/[^0-9]/g, '') : '';
                  const formattedDate = new Date(o.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ref & Date */}
                      <td className="px-5 py-4">
                        <div className="font-mono text-slate-900 font-semibold">
                          #{o.id.substring(0, 8).toUpperCase()}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {formattedDate}
                        </div>
                      </td>

                      {/* Customer & Phone */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{o.customerName}</div>
                        <div className="text-[11px] text-slate-500">{o.businessType || 'Customer'}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <a
                            href={`https://wa.me/${whatsappCleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" />
                            {o.customerPhone}
                          </a>
                        </div>
                      </td>

                      {/* Products / Varieties */}
                      <td className="px-5 py-4 max-w-xs">
                        {o.orderItems && o.orderItems.length > 0 ? (
                          <div className="space-y-1">
                            {o.orderItems.map((item: any, idx: number) => (
                              <div key={idx} className="text-slate-700 font-medium truncate">
                                {item.product?.name || 'Microgreen'} × {item.quantity} (Rs. {item.subtotal?.toLocaleString()})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <p className="text-slate-800 font-medium truncate">
                              {o.selectedVarieties || 'General Inquiry'}
                            </p>
                            {o.message && (
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                "{o.message}"
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {o.totalAmount > 0 ? `Rs. ${o.totalAmount.toLocaleString()}` : 'Enquiry'}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-5 py-4">
                        <div className="relative inline-block">
                          <select
                            value={o.status}
                            disabled={updatingStatusId === o.id}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className={`text-[11px] font-semibold rounded-full px-3 py-1 border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${getStatusBadgeClass(
                              o.status
                            )}`}
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          {updatingStatusId === o.id && (
                            <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-2 text-slate-500" />
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="View order details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-mono text-emerald-600 uppercase font-semibold">
                  Order Details
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  #{selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Information Card */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Customer Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Name</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Business Sector</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.businessType || 'General Customer'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Phone Number</span>
                  <a
                    href={`https://wa.me/${selectedOrder.customerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {selectedOrder.customerPhone}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Date Placed</span>
                  <span className="text-slate-700">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedOrder.customerAddress && (
                <div className="pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-400 block text-[10px]">Delivery Address</span>
                  <span className="text-slate-700">{selectedOrder.customerAddress}</span>
                </div>
              )}
            </div>

            {/* Order Items / Varieties */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Order Items & Varieties
              </h4>

              {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {selectedOrder.orderItems.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveApiImageUrl(item.product?.image)}
                          alt={item.product?.name || 'Microgreen'}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{item.product?.name || 'Microgreen'}</p>
                          <p className="text-[10px] text-slate-400">Qty: {item.quantity} × Rs. {item.price}</p>
                        </div>
                      </div>
                      <div className="font-bold text-slate-800">
                        Rs. {item.subtotal?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-slate-50 flex items-center justify-between font-bold text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-emerald-700 text-sm">Rs. {selectedOrder.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <p>
                    <strong className="text-slate-700">Requested Varieties:</strong>{' '}
                    <span className="text-slate-900">{selectedOrder.selectedVarieties || 'None specified'}</span>
                  </p>
                  {selectedOrder.message && (
                    <p>
                      <strong className="text-slate-700">Customer Note:</strong>{' '}
                      <span className="text-slate-600 italic">"{selectedOrder.message}"</span>
                    </p>
                  )}
                  {selectedOrder.totalAmount > 0 && (
                    <p className="pt-2 font-bold text-slate-900">
                      Estimated Total: Rs. {selectedOrder.totalAmount?.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Status Selector & Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Order Status:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  className={`text-xs font-semibold rounded-lg px-3 py-1.5 border focus:outline-none ${getStatusBadgeClass(
                    selectedOrder.status
                  )}`}
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <a
                href={`https://wa.me/${selectedOrder.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hello ${selectedOrder.customerName}, regarding your Pearl Grove order #${selectedOrder.id.substring(
                    0,
                    8
                  ).toUpperCase()}...`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Open WhatsApp Chat
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
