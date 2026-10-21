import { motion } from 'framer-motion';
import { Sparkles, MessageCircle } from 'lucide-react';
import type { Microgreen } from '../types/microgreen';
import { resolveApiImageUrl } from '../services/api';

interface MicrogreenCardProps {
  microgreen: Microgreen;
  onOrder?: (microgreen: Microgreen) => void;
}

const MicrogreenCard = ({ microgreen, onOrder }: MicrogreenCardProps) => {
  const regularPrice = microgreen.price ?? 0;
  const discountedPrice = microgreen.discountPrice;
  const hasDiscount = typeof discountedPrice === 'number' && discountedPrice >= 0 && discountedPrice < regularPrice;
  const isOrderable = microgreen.isAvailable !== false && (microgreen.stock ?? 1) > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className="group bg-white rounded-3xl shadow-[0_4px_24px_rgba(20,40,30,0.06)] hover:shadow-[0_16px_36px_rgba(20,40,30,0.12)] transition-all duration-300 overflow-hidden border border-forest-900/10 hover:border-leaf-500/40 flex flex-col justify-between"
    >
      <div>
        {/* Image Container with hover zoom */}
        <div className="relative aspect-[4/3] overflow-hidden bg-cream-100">
          <img
            src={resolveApiImageUrl(microgreen.image)}
            alt={`${microgreen.name} microgreens`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/Radish.jpg';
            }}
          />
          {/* Subtle gradient overlay on image bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />

          {/* Floating Pill Badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="backdrop-blur-md bg-forest-900/80 text-cream-50 text-[11px] font-medium tracking-wide px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-white/10">
              <Sparkles className="w-3 h-3 text-leaf-300" />
              {microgreen.profile && microgreen.profile.length > 0 ? microgreen.profile[0] : 'Fresh'}
            </span>
          </div>

          {/* Featured badge if applicable */}
          {regularPrice > 0 ? (
            <div className="absolute top-4 right-4 z-10">
              <span className="backdrop-blur-md bg-white/90 text-forest-900 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm border border-forest-900/10 flex items-center gap-1.5">
                {hasDiscount && <span className="line-through text-forest-500">Rs. {regularPrice.toLocaleString()}</span>}
                Rs. {(hasDiscount ? discountedPrice : regularPrice).toLocaleString()}
              </span>
            </div>
          ) : null}
        </div>

        {/* Card Content */}
        <div className="p-6 sm:p-7 space-y-4">
          <div>
            <h3 className="font-display text-3xl font-medium text-forest-900 mb-1 tracking-tight">
              {microgreen.name}
            </h3>
            {microgreen.notes && (
              <p className="font-body text-xs font-semibold text-leaf-600 tracking-wider">
                {microgreen.notes}
              </p>
            )}
          </div>

          <p className="font-body text-forest-700/90 text-sm leading-relaxed">
            {microgreen.description}
          </p>

          {/* Ideal for Tags */}
          {microgreen.bestSuitedFor && microgreen.bestSuitedFor.length > 0 && (
            <div className="pt-1">
              <p className="font-body text-[11px] text-forest-700/70 uppercase tracking-wider mb-2 font-medium">
                Ideal for
              </p>
              <div className="flex flex-wrap gap-1.5">
                {microgreen.bestSuitedFor.slice(0, 4).map((use) => (
                  <span
                    key={use}
                    className="font-body text-xs bg-[#f4f3ec] hover:bg-[#edece3] text-forest-800 px-3 py-1 rounded-full transition-colors font-normal"
                  >
                    {use}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Action Button */}
      {onOrder && (
        <div className="p-6 sm:p-7 pt-0">
          <button
            type="button"
            onClick={() => onOrder(microgreen)}
            disabled={!isOrderable}
            className="w-full bg-[#152e20] hover:bg-[#1e422e] text-cream-50 py-3 px-4 rounded-full font-body text-xs font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow"
          >
            <MessageCircle className="w-3.5 h-3.5 text-leaf-300" />
            <span>{isOrderable ? 'Order via WhatsApp' : 'Currently unavailable'}</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default MicrogreenCard;
