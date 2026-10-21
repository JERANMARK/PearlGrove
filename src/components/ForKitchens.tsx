import { motion } from 'framer-motion';

const kitchenPillars = [
  {
    title: 'Chef-friendly selection',
    description: 'A balanced collection of mild, sweet, peppery and colourful microgreens suitable for a variety of culinary applications.'
  },
  {
    title: 'Fresh supply',
    description: 'Production planning focused on supplying microgreens while they are at their best.'
  },
  {
    title: 'Consistent quality',
    description: 'Careful growing and monitoring help maintain reliable freshness, visual vibrancy and shelf life.'
  },
  {
    title: 'Flexible growth',
    description: 'Production can be planned around regular hotel and restaurant standing order requirements.'
  }
];

const ForKitchens = () => {
  return (
    <section id="for-kitchens" className="py-24 md:py-32 bg-[#0d2217] text-cream-50 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Chef Plating Photo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <div className="relative aspect-[3/4] max-w-[460px] mx-auto rounded-[2.5rem] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-white/10">
              <img
                src="/images/chef_plating.jpg"
                alt="Executive chef garnishing fine dining dish with Pearl Grove microgreens"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          </motion.div>

          {/* Right Column: Editorial & 2x2 Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 space-y-7"
          >
            <div>
              <p className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-leaf-300 mb-3">
                For hotels, restaurants & cafés
              </p>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-[3.8rem] text-cream-50 leading-[1.05] font-medium">
                Developed with
                <br />
                professional kitchens in
                <br />
                mind
              </h2>
            </div>

            <p className="font-body text-cream-100/85 text-base sm:text-lg leading-relaxed max-w-xl">
              We aim to build reliable relationships with chefs, restaurants, hotels, cafés and purchasing teams that value freshness, presentation and consistent product quality.
            </p>

            {/* 2x2 Feature Grid */}
            <div className="pt-6 border-t border-white/15 grid sm:grid-cols-2 gap-x-8 gap-y-6">
              {kitchenPillars.map((pillar) => (
                <div key={pillar.title} className="space-y-2">
                  <h3 className="font-display text-xl font-semibold text-cream-50">
                    {pillar.title}
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-cream-200/80 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default ForKitchens;