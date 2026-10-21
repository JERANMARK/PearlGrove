import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { brandData } from '../data/brand';
import { Mail, Phone, MapPin, AtSign, Sprout, CheckCircle2, AlertCircle } from 'lucide-react';
import { microgreens } from '../data/microgreens';
import { customerApi, submitCustomerOrder } from '../services/api';

const Contact = () => {
  const orderKeys = useRef(new Map<string, string>());
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessType: 'Hotel',
    selectedVarieties: [] as string[],
    message: ''
  });
  const [whatsappNumber, setWhatsappNumber] = useState(brandData.whatsappNumber);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [persistenceError, setPersistenceError] = useState('');
  const [whatsappFallbackUrl, setWhatsappFallbackUrl] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await customerApi.getSettings();
        if (res.success && res.data?.whatsapp_number) {
          setWhatsappNumber(res.data.whatsapp_number);
        }
      } catch {
        // Fallback to brandData
      }
    };
    fetchSettings();
  }, []);

  const businessTypes = [
    'Hotel',
    'Restaurant',
    'Café',
    'Chef',
    'Modern Kitchen',
    'Individual',
    'Other'
  ];

  const handleVarietyToggle = (variety: string) => {
    setFormData(prev => ({
      ...prev,
      selectedVarieties: prev.selectedVarieties.includes(variety)
        ? prev.selectedVarieties.filter(v => v !== variety)
        : [...prev.selectedVarieties, variety]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setWhatsappFallbackUrl('');
    const whatsappWindow = window.open('about:blank', '_blank');

    const message = `Pearl Grove Microgreens Supply Enquiry

Name: ${formData.name}
Phone: ${formData.phone}
Business Type: ${formData.businessType}
Selected Varieties: ${formData.selectedVarieties.join(', ')}
Message: ${formData.message}`;

    let saved = false;
    try {
      const orderPayload = {
        customerName: formData.name.trim(),
        customerPhone: formData.phone.trim(),
        businessType: formData.businessType,
        message: formData.message.trim(),
        selectedVarieties: formData.selectedVarieties,
      };
      const result = await submitCustomerOrder(orderPayload, 'pearl-grow-contact-order-key', orderKeys.current);
      saved = result.success === true;
    } catch {
      saved = false;
    }
    setPersistenceError(saved ? '' : 'Your enquiry could not be saved. WhatsApp will still open; please mention that the website did not record it.');

    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    if (whatsappWindow) whatsappWindow.location.href = whatsappUrl;
    else setWhatsappFallbackUrl(whatsappUrl);

    setIsSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <>
      {/* Contact Section */}
      <section id="contact" className="py-24 md:py-32 bg-[#faf8f2]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            
            {/* Left Column: Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <p className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-leaf-700 mb-3">
                  Contact Pearl Grove
                </p>
                <h2 className="font-display text-4xl sm:text-5xl text-forest-900 leading-tight font-medium mb-4">
                  Rooted in Sri Lanka's hill country. Grown with care.
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Sprout className="w-6 h-6 text-leaf-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-display text-xl text-forest-900 font-semibold mb-2">Founder Lavanya</h3>
                    <p className="font-body text-forest-700">
                      Passionate about bringing fresh, high-quality microgreens to modern kitchens across Sri Lanka.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-leaf-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-display text-xl text-forest-900 font-semibold mb-2">Growing location</h3>
                    <p className="font-body text-forest-700">
                      {brandData.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-leaf-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-display text-xl text-forest-900 font-semibold mb-2">Contact</h3>
                    <a
                      href={brandData.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-forest-700 hover:text-leaf-600 transition-colors"
                    >
                      {brandData.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-leaf-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-display text-xl text-forest-900 font-semibold mb-2">Email</h3>
                    <a
                      href={`mailto:${brandData.email}`}
                      className="font-body text-forest-700 hover:text-leaf-600 transition-colors"
                    >
                      {brandData.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="font-display text-xl text-forest-900 font-semibold mb-4">Follow Us</h3>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2 text-forest-700">
                    <AtSign className="w-4 h-4" />
                    <span className="font-body text-sm">Instagram - Coming soon</span>
                  </div>
                  <div className="flex items-center gap-2 text-forest-700">
                    <AtSign className="w-4 h-4" />
                    <span className="font-body text-sm">Facebook - Coming soon</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Supply Enquiry Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-forest-900/10">
                <h2 className="font-display text-3xl text-forest-900 font-medium mb-2">
                  Send a supply enquiry
                </h2>
                <p className="font-body text-forest-700 mb-8">
                  Tell us about your requirements and we'll get back to you.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block font-body text-sm font-semibold text-forest-800 mb-2">
                        Your name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 rounded-full border border-forest-900/15 focus:outline-none focus:ring-2 focus:ring-leaf-400 font-body text-sm bg-cream-50/50"
                        placeholder="Full name"
                        required
                        maxLength={120}
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block font-body text-sm font-semibold text-forest-800 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 rounded-full border border-forest-900/15 focus:outline-none focus:ring-2 focus:ring-leaf-400 font-body text-sm bg-cream-50/50"
                        placeholder="07X XXX XXXX"
                        required
                        maxLength={40}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="businessType" className="block font-body text-sm font-semibold text-forest-800 mb-2">
                      I'm enquiring for a
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                      className="w-full px-4 py-3 rounded-full border border-forest-900/15 focus:outline-none focus:ring-2 focus:ring-leaf-400 font-body text-sm bg-cream-50/50 text-forest-800"
                    >
                      {businessTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-body text-sm font-semibold text-forest-800 mb-3">
                      Varieties of interest
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {microgreens.map((microgreen) => (
                        <button
                          key={microgreen.id}
                          type="button"
                          onClick={() => handleVarietyToggle(microgreen.name)}
                          className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                            formData.selectedVarieties.includes(microgreen.name)
                              ? 'bg-[#487a3d] text-white'
                              : 'bg-cream-100 text-forest-800 hover:bg-cream-200'
                          }`}
                        >
                          {microgreen.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block font-body text-sm font-semibold text-forest-800 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      maxLength={2000}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border border-forest-900/15 focus:outline-none focus:ring-2 focus:ring-leaf-400 font-body text-sm bg-cream-50/50 resize-none"
                      placeholder="Tell us about your requirements..."
                    />
                  </div>

                  {submitted && (
                    <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${persistenceError ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
                      {persistenceError ? <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                      <span>{persistenceError || 'Enquiry recorded and WhatsApp opened. We will respond promptly!'}</span>
                    </div>
                  )}

                  {submitted && whatsappFallbackUrl && (
                    <a href={whatsappFallbackUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-sm font-semibold text-leaf-700 underline">
                      Continue to WhatsApp
                    </a>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#487a3d] hover:bg-[#3d6934] text-white py-4 rounded-full font-body text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{isSubmitting ? 'Connecting...' : 'Send via WhatsApp'}</span>
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
