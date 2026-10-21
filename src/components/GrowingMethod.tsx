import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

const approachPillars = [
  'Careful seed selection',
  'Clean growing practices',
  'Small-batch cultivation',
  'Appropriate light & moisture',
  'Good airflow',
  'Regular crop monitoring',
];

const GrowingMethod = () => {
  return (
    <section id="growing" className="py-24 md:py-32 bg-white overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Vertical Farm Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[3/4] max-w-[460px] mx-auto rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(20,40,30,0.12)] border border-forest-900/10">
              <img
                src="/images/vertical_farm.jpg"
                alt="Indoor vertical microgreens nursery in Maskeliya"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              
              {/* Floating Badge */}
              <div className="absolute bottom-6 left-6 right-6 backdrop-blur-md bg-forest-900/85 border border-white/15 p-4 rounded-2xl text-cream-50 shadow-lg">
                <div className="flex items-center gap-2 text-leaf-300 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Hill-Country Growing
                </div>
                <p className="font-body text-xs text-cream-100/90 leading-snug">
                  Upcot, Maskeliya · Pure mountain water and controlled cultivation
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Editorial & Approach */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 space-y-7"
          >
            <div>
              <p className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-leaf-700 mb-3">
                Our growing method
              </p>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-[3.8rem] text-forest-900 leading-[1.05] font-medium">
                Close attention,
                <br />
                every batch
              </h2>
            </div>

            <div className="space-y-4 text-forest-700 text-base sm:text-lg leading-relaxed max-w-xl">
              <p>
                Our microgreens are grown in a clean, carefully managed environment. The process begins with the selection of suitable seeds and the preparation of clean growing trays and media.
              </p>
              <p>
                Throughout the growing period we manage light, moisture and airflow, observing each crop until it reaches the right stage for harvesting.
              </p>
            </div>

            {/* Approach Subheading & 2-column checklist */}
            <div className="pt-4 border-t border-forest-900/10">
              <h3 className="font-body text-sm font-semibold text-forest-900 mb-5 tracking-tight">
                Our approach is centred around
              </h3>

              <div className="grid sm:grid-cols-2 gap-3 max-w-xl">
                {approachPillars.map((pillar, i) => (
                  <motion.div
                    key={pillar}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.07 }}
                    className="flex items-center gap-3 bg-[#f3f7f2] hover:bg-[#eaf3e9] border border-[#dce8db] hover:border-leaf-400 rounded-full px-4 py-3 transition-all duration-200 shadow-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-leaf-500/20 text-leaf-700 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span className="font-body text-xs sm:text-sm font-medium text-forest-800">
                      {pillar}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default GrowingMethod;