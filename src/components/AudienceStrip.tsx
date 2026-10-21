import { motion } from 'framer-motion';
import { brandData } from '../data/brand';

const AudienceStrip = () => {
  return (
    <section className="bg-forest-900 py-7 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center gap-x-8 gap-y-3"
        >
          <h2 className="font-body text-sm text-leaf-300 tracking-wide">
            Grown for
          </h2>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {brandData.audience.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center"
              >
                <span className="font-display text-xl md:text-2xl text-cream-50">
                  {item}
                </span>
                {index < brandData.audience.length - 1 && (
                  <span className="mx-4 md:mx-6 text-leaf-500 text-2xl">·</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AudienceStrip;