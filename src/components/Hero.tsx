import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, MapPin, Sparkles, Leaf as LeafIcon } from 'lucide-react';
import { brandData } from '../data/brand';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-forest-900">
      {/* Background with modern effects */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero_hill_country.jpg"
          alt="Fresh microgreens growing in hill country greenhouse"
          className="w-full h-full object-cover object-center opacity-85"
        />
        
        {/* Modern gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1e15]/95 via-[#0d1e15]/75 to-[#0d1e15]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1e15]/70 via-transparent to-black/20" />
        
        {/* Animated grain texture */}
        <div className="hero-grain absolute inset-0 opacity-20 mix-blend-soft-light" />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-leaf-300/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-14 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Location Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-leaf-300 px-4 py-2 rounded-full text-sm font-semibold border border-white/20"
            >
              <MapPin className="w-4 h-4" />
              <span>{brandData.location}</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium text-cream-50 leading-[1.1] tracking-[-0.02em]"
            >
              Fresh Greens.
              <br />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="italic text-leaf-300 font-normal"
              >
                Healthier Living.
              </motion.span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="font-body text-cream-100/90 text-lg md:text-xl leading-relaxed max-w-xl"
            >
              Premium hill-country grown microgreens for hotels, restaurants, cafés, chefs and modern kitchens.
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-wrap gap-3"
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-cream-100 px-4 py-2 rounded-full text-sm border border-white/20">
                <LeafIcon className="w-4 h-4 text-leaf-300" />
                <span>Premium Quality</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-cream-100 px-4 py-2 rounded-full text-sm border border-white/20">
                <Sparkles className="w-4 h-4 text-leaf-300" />
                <span>Fresh Daily</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-cream-100 px-4 py-2 rounded-full text-sm border border-white/20">
                <LeafIcon className="w-4 h-4 text-leaf-300" />
                <span>Sustainable</span>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 pt-2"
            >
              <a
                href="#microgreens"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-leaf-400 to-emerald-500 hover:from-leaf-500 hover:to-emerald-600 text-forest-900 px-8 py-4 rounded-full font-body text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 relative overflow-hidden"
              >
                <span className="relative z-10">Explore our microgreens</span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </a>
              <a
                href={brandData.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-cream-50 border border-white/30 px-8 py-4 rounded-full font-body text-sm font-semibold transition-all duration-300 hover:scale-105"
              >
                Supply enquiry
              </a>
            </motion.div>
          </motion.div>

          {/* Right side - Decorative Elements */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative hidden md:block"
          >
            {/* Main image card */}
            <div className="relative">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20"
              >
                <img
                  src="/images/harvest_microgreens.jpg"
                  alt="Person harvesting fresh microgreens"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                
                {/* Floating badge */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-leaf-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <LeafIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-display text-lg text-cream-50 font-semibold">100% Fresh</p>
                      <p className="font-body text-sm text-cream-100/80">Harvested daily</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Decorative elements */}
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-8 -right-8 w-32 h-32 border-2 border-leaf-300/30 rounded-full"
              />
              <motion.div
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-8 -left-8 w-24 h-24 border-2 border-emerald-300/30 rounded-full"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-6 sm:left-10 lg:left-14 z-10 flex items-center gap-3 text-cream-50/60"
      >
        <span className="section-kicker text-[.58rem]">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>

      {/* Side branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 right-6 sm:right-10 lg:right-14 z-10"
      >
        <div className="font-brand text-xs tracking-[.2em] text-cream-50/70 [writing-mode:vertical-rl]">
          PEARL GROVE / 01
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;