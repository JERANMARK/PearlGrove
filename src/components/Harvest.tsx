import { motion } from 'framer-motion';

const Harvest = () => {
  return (
    <section className="py-24 md:py-32 bg-[#edf4ea] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Editorial & Pillars */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 space-y-7"
          >
            <div>
              <p className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-leaf-700 mb-3">
                Harvest & freshness
              </p>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-[3.8rem] text-forest-900 leading-[1.05] font-medium">
                Freshness is at the heart of
                <br />
                Pearl Grove
              </h2>
            </div>

            <div className="space-y-4 text-forest-800/90 text-base sm:text-lg leading-relaxed max-w-xl">
              <p>
                Our microgreens are harvested at the appropriate stage of growth to preserve their colour, texture, flavour and overall quality. Each batch is carefully harvested, handled and packed to stay fresh from our growing space to you.
              </p>
              <p>
                For hotel, restaurant and café partners, we plan production according to demand — so you receive freshly harvested greens with consistent quality and reliable supply.
              </p>
            </div>

            {/* 3 Pillars at Bottom */}
            <div className="pt-8 border-t border-forest-900/10 grid sm:grid-cols-3 gap-6">
              <div>
                <h3 className="font-display text-xl font-semibold text-forest-900 mb-1.5">
                  Fresh
                </h3>
                <p className="font-body text-xs sm:text-sm text-forest-700 leading-relaxed">
                  Harvested at the appropriate stage of growth.
                </p>
              </div>

              <div>
                <h3 className="font-display text-xl font-semibold text-forest-900 mb-1.5">
                  Carefully handled
                </h3>
                <p className="font-body text-xs sm:text-sm text-forest-700 leading-relaxed">
                  Attention is given to the product throughout harvesting and packing.
                </p>
              </div>

              <div>
                <h3 className="font-display text-xl font-semibold text-forest-900 mb-1.5">
                  Planned supply
                </h3>
                <p className="font-body text-xs sm:text-sm text-forest-700 leading-relaxed">
                  Production can be planned according to regular customer requirements.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Harvest Photo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <div className="relative aspect-[3/4] max-w-[460px] mx-auto rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(20,40,30,0.12)] border border-forest-900/10">
              <img
                src="/images/harvest_microgreens.jpg"
                alt="Fresh microgreens harvesting by hand at Pearl Grove"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Harvest;