import { motion } from 'framer-motion';
import { brandData } from '../data/brand';
import { Leaf, Heart, Droplet, Sprout } from 'lucide-react';

const AboutSection = () => {
  return (
    <section id="about" className="py-24 md:py-32 bg-[#faf8f2] relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-leaf-700 mb-4">
            About Pearl Grove
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-forest-900 leading-tight font-medium max-w-4xl mx-auto">
            Quality. Freshness. Care.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-leaf-100 rounded-full flex items-center justify-center mb-6">
              <Leaf className="w-8 h-8 text-leaf-600" />
            </div>
            <h3 className="font-display text-2xl text-forest-900 font-semibold mb-4">Quality</h3>
            <p className="font-body text-forest-700 leading-relaxed">
              Every microgreen is carefully cultivated using premium seeds and sustainable growing methods to ensure the highest quality standards.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-leaf-100 rounded-full flex items-center justify-center mb-6">
              <Droplet className="w-8 h-8 text-leaf-600" />
            </div>
            <h3 className="font-display text-2xl text-forest-900 font-semibold mb-4">Freshness</h3>
            <p className="font-body text-forest-700 leading-relaxed">
              Harvested daily and delivered fresh to your kitchen, our microgreens retain maximum flavor, nutrition, and vibrant color.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-leaf-100 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-leaf-600" />
            </div>
            <h3 className="font-display text-2xl text-forest-900 font-semibold mb-4">Care</h3>
            <p className="font-body text-forest-700 leading-relaxed">
              From seed to harvest, each tray receives personal attention and care, ensuring consistency and excellence in every batch.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-gradient-to-br from-[#1b3827] to-[#12281b] rounded-2xl p-8 md:p-12 text-center"
        >
          <Sprout className="w-12 h-12 text-leaf-300 mx-auto mb-6" />
          <p className="font-display italic text-3xl sm:text-4xl text-cream-50 leading-tight max-w-3xl mx-auto">
            {brandData.tagline}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;