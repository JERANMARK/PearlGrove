import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { flavorProfiles } from '../data/microgreens';
import { brandData } from '../data/brand';
import { customerApi, resolveApiImageUrl, submitCustomerOrder } from '../services/api';
import MicrogreenCard from './MicrogreenCard';
import type { Microgreen, FlavorProfile } from '../types/microgreen';
import { MessageCircle, X, Plus, Minus, ShoppingBag, CheckCircle, AlertTriangle } from 'lucide-react';

const Collection = () => {
  const orderKeys = useRef(new Map<string, string>());
  const [items, setItems] = useState<Microgreen[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [catalogRetry, setCatalogRetry] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FlavorProfile | 'All'>('All');
  const [whatsappNumber, setWhatsappNumber] = useState(brandData.whatsappNumber);

  // Quick Order Modal State
  const [selectedProduct, setSelectedProduct] = useState<Microgreen | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(2);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderPersistenceError, setOrderPersistenceError] = useState('');
  const [whatsappFallbackUrl, setWhatsappFallbackUrl] = useState('');

  useEffect(() => {
    let isCurrent = true;
    const loadCatalogAndSettings = async () => {
      setCatalogStatus('loading');
      try {
        const [settingsRes, prodRes] = await Promise.all([
          customerApi.getSettings(),
          customerApi.getProducts({ availableOnly: true }),
        ]);
        if (!isCurrent) return;

        if (settingsRes.success && settingsRes.data?.whatsapp_number) {
          setWhatsappNumber(settingsRes.data.whatsapp_number);
        }

        if (!prodRes.success || !Array.isArray(prodRes.data)) {
          setItems([]);
          setCatalogStatus('error');
          return;
        }

        const mapped: Microgreen[] = prodRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          notes: p.notes || '',
          description: p.description || '',
          image: p.image || '/images/Radish.jpg',
          price: Number(p.price),
          discountPrice: p.discountPrice === null || p.discountPrice === undefined ? null : Number(p.discountPrice),
          stock: Number(p.stock),
          isAvailable: p.isAvailable !== false,
          profile: Array.isArray(p.profile)
            ? p.profile
            : typeof p.profile === 'string'
            ? p.profile.split(',').map((s: string) => s.trim())
            : ['Fresh'],
          bestSuitedFor: Array.isArray(p.bestSuitedFor)
            ? p.bestSuitedFor
            : typeof p.bestSuitedFor === 'string'
            ? p.bestSuitedFor.split(',').map((s: string) => s.trim())
            : ['Salads', 'Garnishes'],
        }));
        setItems(mapped);
        setCatalogStatus('ready');
      } catch {
        if (!isCurrent) return;
        setItems([]);
        setCatalogStatus('error');
      }
    };

    loadCatalogAndSettings();
    return () => { isCurrent = false; };
  }, [catalogRetry]);

  const filteredMicrogreens = activeFilter === 'All'
    ? items
    : items.filter(m => m.profile && m.profile.some(p => p.toLowerCase().includes(activeFilter.toLowerCase())));

  const handleOpenOrder = (microgreen: Microgreen) => {
    setSelectedProduct(microgreen);
    setOrderQuantity(Math.min(2, Math.max(1, microgreen.stock ?? 2)));
    setOrderSubmitted(false);
    setOrderPersistenceError('');
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const whatsappWindow = window.open('about:blank', '_blank');
    setWhatsappFallbackUrl('');
    setIsSubmittingOrder(true);

    let orderResult: any;
    try {
      const orderPayload = {
        customerName: customerName.trim() || 'WhatsApp Customer',
        customerPhone: customerPhone.trim() || 'Via WhatsApp',
        selectedVarieties: [`${selectedProduct.name} (${orderQuantity} units)`],
        items: [
          {
            productId: selectedProduct.id,
            quantity: orderQuantity,
          },
        ],
      };
      orderResult = await submitCustomerOrder(orderPayload, 'pearl-grow-collection-order-key', orderKeys.current);
      if (!orderResult?.success || !orderResult.data) {
        setOrderPersistenceError(orderResult?.error || 'We could not save this order. Please tell us it was not recorded when you message us.');
      }
    } catch {
      setOrderPersistenceError('We could not save this order. Please tell us it was not recorded when you message us.');
    }

    const savedOrderItem = orderResult?.data?.orderItems?.[0];
    const unitPrice = savedOrderItem?.price ?? selectedProduct.price ?? 1500;
    const totalPrice = orderResult?.data?.totalAmount ?? unitPrice * orderQuantity;
    let message = `Pearl Grow Order\n\n`;
    message += `Product: ${selectedProduct.name} Microgreens\n`;
    message += `Quantity: ${orderQuantity}\n`;
    message += `Price: Rs. ${Number(unitPrice).toLocaleString()}\n`;
    message += `Total: Rs. ${Number(totalPrice).toLocaleString()}\n`;
    if (customerName.trim()) message += `Customer: ${customerName.trim()}\n`;
    if (customerPhone.trim()) message += `Phone: ${customerPhone.trim()}\n`;

    // Open WhatsApp
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${cleanNumber}?text=${encoded}`;
    if (whatsappWindow) whatsappWindow.location.href = url;
    else setWhatsappFallbackUrl(url);

    setIsSubmittingOrder(false);
    setOrderSubmitted(true);
    setTimeout(() => {
      setSelectedProduct(null);
    }, 2000);
  };

  return (
    <section id="microgreens" className="py-24 md:py-32 bg-[#faf8f2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-left mb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
        >
          <div>
            <p className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-leaf-700 mb-3">
              Our microgreens
            </p>
            <h2 className="font-display text-5xl md:text-6xl lg:text-[4.2rem] text-forest-900 leading-tight font-medium">
              The starter collection
            </h2>
            <p className="font-body text-forest-700/80 text-base md:text-lg max-w-2xl mt-4 leading-relaxed">
              Carefully cultivated varieties selected for exceptional flavour, vibrant colour, delicate crunch and culinary versatility.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {flavorProfiles.map((profile) => (
              <button
                key={profile}
                onClick={() => setActiveFilter(profile as FlavorProfile | 'All')}
                className={`px-5 py-2 rounded-full font-body text-xs font-medium tracking-wide transition-all duration-300 ${
                  activeFilter === profile
                    ? 'bg-[#152e20] text-white shadow-md shadow-forest-900/15'
                    : 'bg-white hover:bg-cream-100 text-forest-800 border border-forest-900/10 shadow-sm'
                }`}
              >
                {profile}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Product Grid */}
        <motion.div
          layout
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredMicrogreens.map((microgreen) => (
              <MicrogreenCard
                key={microgreen.id}
                microgreen={microgreen}
                onOrder={handleOpenOrder}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Catalog loading, failure, and empty states */}
        {catalogStatus !== 'ready' || filteredMicrogreens.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            {catalogStatus === 'loading' ? (
              <p role="status" className="font-body text-forest-600 text-lg">Loading available products…</p>
            ) : catalogStatus === 'error' ? (
              <div className="space-y-3">
                <p role="alert" className="font-body text-forest-600 text-lg">We couldn’t load the current product list.</p>
                <button type="button" onClick={() => setCatalogRetry((attempt) => attempt + 1)} className="font-body text-sm font-semibold text-leaf-700 underline">Try again</button>
              </div>
            ) : (
              <p className="font-body text-forest-600 text-lg">
                {items.length === 0 ? 'No products are currently available.' : 'No microgreens found for this filter.'}
              </p>
            )}
          </motion.div>
        ) : null}
      </div>

      {/* WhatsApp Order Modal Dialog */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-forest-900/10 space-y-6">
            <div className="flex items-center justify-between border-b border-forest-900/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-leaf-50 flex items-center justify-center text-leaf-700">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-medium text-forest-900">
                    Order via WhatsApp
                  </h3>
                  <p className="font-body text-xs text-forest-600">
                    {selectedProduct.name} Microgreens
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-forest-500 hover:text-forest-900 rounded-full hover:bg-cream-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${orderPersistenceError ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'}`}>
                  {orderPersistenceError ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                </div>
                <h4 className="font-display text-lg text-forest-900">
                  Connecting to WhatsApp...
                </h4>
                <p className={`font-body text-xs ${orderPersistenceError ? 'text-amber-900' : 'text-forest-600'}`}>
                  {orderPersistenceError || 'Your order details have been recorded. WhatsApp will open with your pre-formatted order summary.'}
                </p>
                {whatsappFallbackUrl && <a href={whatsappFallbackUrl} target="_blank" rel="noopener noreferrer" className="inline-block font-body text-sm font-semibold text-leaf-700 underline">Continue to WhatsApp</a>}
              </div>
            ) : (
              <form onSubmit={handleConfirmOrder} className="space-y-4">
                {/* Product Summary Row */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-cream-50 border border-forest-900/10">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveApiImageUrl(selectedProduct.image)}
                      alt={selectedProduct.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-display text-sm font-medium text-forest-900">
                        {selectedProduct.name}
                      </p>
                      <p className="font-body text-xs text-forest-600">
                        Rs. {(selectedProduct.discountPrice ?? selectedProduct.price ?? 0).toLocaleString()} / pack
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 bg-white rounded-full px-2 py-1 border border-forest-900/10">
                    <button
                      type="button"
                      onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                      className="p-1 text-forest-700 hover:text-forest-900"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-body text-xs font-semibold px-1 text-forest-900">
                      {orderQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOrderQuantity(Math.min(selectedProduct.stock ?? 100, orderQuantity + 1))}
                      className="p-1 text-forest-700 hover:text-forest-900"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Optional Customer Info */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block font-body text-xs font-semibold text-forest-800 mb-1">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      maxLength={120}
                      placeholder="e.g. Chef Samantha / Hotel Blue"
                      className="w-full px-4 py-2.5 rounded-full border border-forest-900/15 focus:outline-none focus:ring-2 focus:ring-leaf-400 font-body text-xs bg-cream-50/50"
                    />
                  </div>

                  <div>
                    <label className="block font-body text-xs font-semibold text-forest-800 mb-1">
                      Your Contact Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      maxLength={40}
                      placeholder="07X XXX XXXX"
                      className="w-full px-4 py-2.5 rounded-full border border-forest-900/15 focus:outline-none focus:ring-2 focus:ring-leaf-400 font-body text-xs bg-cream-50/50"
                    />
                  </div>
                </div>

                {/* Total Calculation */}
                <div className="p-3 bg-cream-100/60 rounded-2xl flex items-center justify-between text-xs">
                  <span className="font-body text-forest-700 font-medium">Estimated Total:</span>
                  <span className="font-display text-base font-semibold text-forest-900">
                    Rs. {((selectedProduct.discountPrice ?? selectedProduct.price ?? 0) * orderQuantity).toLocaleString()}
                  </span>
                </div>

                {/* WhatsApp Order Button */}
                <button
                  type="submit"
                    disabled={isSubmittingOrder}
                  className="w-full bg-[#487a3d] hover:bg-[#3d6934] text-white py-3.5 px-6 rounded-full font-body text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mt-4"
                >
                  <MessageCircle className="w-4 h-4" />
                    <span>{isSubmittingOrder ? 'Saving order…' : 'Send Order to WhatsApp'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Collection;
