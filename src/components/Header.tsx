import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sprout, MessageCircle } from 'lucide-react';
import { brandData } from '../data/brand';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'About', href: '#about' },
    { name: 'Microgreens', href: '#microgreens' },
    { name: 'Growing', href: '#growing' },
    { name: 'For Business', href: '#for-kitchens' },
    { name: 'Contact', href: '#contact' }
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 transition-all duration-300"
    >
      <nav
        className={`max-w-[1180px] mx-auto px-5 sm:px-8 py-2.5 sm:py-3 transition-all duration-300 rounded-full ${
          isScrolled
            ? 'bg-[#152e20]/95 backdrop-blur-md shadow-xl border border-white/10'
            : 'bg-transparent border-transparent shadow-none'
        }`}
      >
        <div className="flex items-center justify-between min-h-[50px] gap-2 sm:gap-6">
          {/* Logo */}
          <a href="#" className="flex-shrink-0 flex items-center gap-3 group">
            <Sprout className="w-6 h-6 sm:w-7 sm:h-7 text-leaf-300 group-hover:rotate-6 transition-transform" strokeWidth={1.8} />
            <div>
              <h1 className="font-brand text-sm sm:text-base md:text-lg font-semibold text-cream-50 tracking-wider leading-none">
                {brandData.name}
              </h1>
              <p className="font-body text-[7px] sm:text-[8px] md:text-[9px] text-leaf-300 tracking-[0.25em] mt-1">
                {brandData.subBrand}
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-7 lg:space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="font-body text-cream-100 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                {item.name}
              </a>
            ))}
            <a
              href={brandData.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#487a3d] hover:bg-[#3d6934] text-white px-5 py-2.5 rounded-full font-body text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
            >
              <MessageCircle className="w-4 h-4" />
              Order Now
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <a
              href={brandData.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#487a3d] text-white p-2 rounded-full font-body text-xs font-semibold"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-cream-50 hover:text-leaf-300 transition-colors p-1"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="md:hidden max-w-[1180px] mx-auto mt-2 bg-[#152e20]/95 backdrop-blur-md rounded-3xl border border-white/10 p-5 shadow-2xl"
          >
            <div className="space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block font-body text-cream-50 hover:text-leaf-300 transition-colors duration-200 text-sm font-medium py-2 px-3 rounded-lg hover:bg-white/5"
                >
                  {item.name}
                </a>
              ))}
              <a
                href={brandData.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#487a3d] hover:bg-[#3d6934] text-white px-5 py-3 rounded-full font-body text-sm font-semibold transition-colors duration-200 text-center mt-3 shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                Order Now
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;