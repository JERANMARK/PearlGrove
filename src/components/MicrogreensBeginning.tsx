import { motion } from 'framer-motion';
import { brandData } from '../data/brand';
import { Sprout, ArrowRight, TrendingUp, Leaf, Flower2, TreePine } from 'lucide-react';

const MicrogreensBeginning = () => {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-[#152e20] via-[#1a3a28] to-[#0d1e15] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-leaf-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
        />
        
        {/* Floating icons */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 opacity-5"
        >
          <Sprout className="w-32 h-32 text-leaf-300" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-20 opacity-5"
        >
          <TreePine className="w-40 h-40 text-emerald-300" />
        </motion.div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Icon with glow effect */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12 relative inline-block"
          >
            <div className="absolute inset-0 bg-leaf-400/30 rounded-full blur-2xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-leaf-400 to-emerald-500 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl">
              <Sprout className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
          </motion.div>
          
          {/* Section label */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-leaf-300 px-4 py-2 rounded-full text-sm font-semibold border border-white/10">
              <TrendingUp className="w-4 h-4" />
              Our Vision
            </span>
          </motion.div>
          
          {/* Main heading with gradient text */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-cream-50 via-leaf-200 to-cream-50 leading-tight font-medium mb-8"
          >
            Microgreens are only the beginning
          </motion.h2>
          
          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="font-body text-cream-100/90 text-lg md:text-xl leading-relaxed mb-12 max-w-3xl mx-auto"
          >
            Our long-term goal is to expand into fresh vegetables, herbs and specialty produce — while staying connected to responsible growing practices and the natural character of Sri Lanka's hill country.
          </motion.p>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors">
              <Leaf className="w-8 h-8 text-leaf-300 mx-auto mb-3" />
              <h4 className="font-display text-lg text-cream-50 font-semibold mb-2">Fresh Vegetables</h4>
              <p className="font-body text-cream-100/70 text-sm">Farm-to-table quality produce</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors">
              <Flower2 className="w-8 h-8 text-emerald-300 mx-auto mb-3" />
              <h4 className="font-display text-lg text-cream-50 font-semibold mb-2">Herbs & Greens</h4>
              <p className="font-body text-cream-100/70 text-sm">Aromatic specialty varieties</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors">
              <TreePine className="w-8 h-8 text-teal-300 mx-auto mb-3" />
              <h4 className="font-display text-lg text-cream-50 font-semibold mb-2">Sustainable Growth</h4>
              <p className="font-body text-cream-100/70 text-sm">Responsible farming practices</p>
            </div>
          </motion.div>

          {/* Tagline with special styling */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mb-12"
          >
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-gradient-to-r from-leaf-400 to-emerald-500 blur-xl opacity-30" />
              <h3 className="font-display italic text-4xl sm:text-5xl text-leaf-300 font-normal relative">
                {brandData.tagline}
              </h3>
            </div>
          </motion.div>

          {/* Modern CTA button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <a
              href="#contact"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-leaf-400 to-emerald-500 hover:from-leaf-500 hover:to-emerald-600 text-forest-900 px-8 py-4 rounded-full font-body text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 relative overflow-hidden"
            >
              <span className="relative z-10">Join our journey</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default MicrogreensBeginning;