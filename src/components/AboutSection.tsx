import { motion } from 'framer-motion';
import { brandData } from '../data/brand';

const AboutSection = () => {
  return (
    <section id="about" className="py-28 md:py-32 bg-cream-50">
      <div className="max-w-[1160px] mx-auto px-5 sm:px-8 lg:px-10 xl:px-0">
        <div className="grid lg:grid-cols-[1.3fr_0.9fr] gap-12 lg:gap-16 items-start">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-7"
          >
            <p className="font-body text-sm text-leaf-700 mb-2">About Pearl Grove</p>

            <h2 className="font-display text-5xl md:text-6xl lg:text-[4.1rem] text-forest-900 leading-[0.98] font-medium max-w-[680px]">
              Rooted in the hill country
              <br />
              of Upcot, Maskeliya
            </h2>

            <div className="space-y-5 max-w-[650px] pt-6">
              <p className="font-body text-forest-800 text-lg leading-relaxed">
                Pearl Grove is a Sri Lankan fresh-produce brand created with a simple purpose — to grow fresh, high-quality produce with care and bring it closer to modern kitchens. We begin our journey with a carefully selected range of premium microgreens.
              </p>

              <p className="font-body text-forest-800 text-lg leading-relaxed">
                We focus on freshness, quality, careful cultivation and consistent supply. Every tray receives close attention from seed to harvest, with the aim of delivering vibrant colour, fresh flavour, appealing texture and beautiful presentation.
              </p>

              <p className="font-body text-forest-800 text-lg leading-relaxed">
                Our vision extends beyond microgreens. As the brand grows, we aim to expand into fresh vegetables, herbs and specialty produce — while staying connected to responsible growing practices and the natural character of Sri Lanka&apos;s hill country.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="pt-16"
          >
            <div className="border-t border-forest-900/15 py-7">
              <h3 className="font-body text-sm font-bold text-forest-900 mb-3">Our Vision</h3>
              <p className="font-body text-forest-700 text-lg leading-relaxed">
                To grow Pearl Grove into a trusted Sri Lankan fresh-produce brand known for quality, freshness and responsible cultivation.
              </p>
            </div>
            <div className="border-t border-forest-900/15 py-7">
              <h3 className="font-body text-sm font-bold text-forest-900 mb-3">Our Mission</h3>
              <p className="font-body text-forest-700 text-lg leading-relaxed">
                To carefully grow and deliver fresh, high-quality produce that supports healthier living and provides chefs, businesses and consumers with ingredients they can rely on.
              </p>
            </div>
            <div className="border-t border-forest-900/15 pt-7">
              <h3 className="font-body text-sm font-bold text-forest-900 mb-4">Our Brand Promise</h3>
              <p className="font-display italic text-3xl md:text-4xl text-leaf-700 leading-tight">
                {brandData.tagline}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;