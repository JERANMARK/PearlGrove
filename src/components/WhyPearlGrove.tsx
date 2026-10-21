import { motion } from 'framer-motion';
import { brandData } from '../data/brand';
import { Mountain, Droplets, Leaf, ChefHat, TrendingUp, Sprout } from 'lucide-react';

const WhyPearlGrove = () => {
  const icons = [Mountain, Droplets, Leaf, ChefHat, TrendingUp, Sprout];
  const gradients = [
    'from-emerald-500 to-teal-600',
    'from-green-500 to-emerald-600',
    'from-teal-500 to-cyan-600',
    'from-lime-500 to-green-600',
    'from-green-600 to-emerald-700',
    'from-teal-600 to-cyan-700'
  ];

  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-cream-50 via-white to-leaf-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-leaf-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-leaf-100 text-leaf-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Sprout className="w-4 h-4" />
            <span>Our Advantages</span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl text-forest-900 font-medium mb-6">
            Why Pearl Grove
          </h2>
          <p className="font-body text-lg text-forest-700 max-w-2xl mx-auto">
            Discover what sets our microgreens apart and makes them the perfect choice for your culinary creations.
          </p>
        </motion.div>

        {/* Reasons Grid with Modern Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {brandData.whyUs.map((reason, index) => {
            const Icon = icons[index];
            const gradient = gradients[index];
            
            return (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative"
              >
                {/* Card */}
                <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-forest-100 overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Number badge */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-leaf-400 to-leaf-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="font-display text-2xl font-bold text-white">
                      {index + 1}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <div className="space-y-4 relative z-10">
                    <h3 className="font-display text-2xl font-semibold text-forest-900 group-hover:text-leaf-700 transition-colors">
                      {reason.title}
                    </h3>
                    <p className="font-body text-forest-700 leading-relaxed">
                      {reason.description}
                    </p>
                  </div>

                  {/* Decorative line */}
                  <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-leaf-500 to-emerald-600 hover:from-leaf-600 hover:to-emerald-700 text-white px-8 py-4 rounded-full font-body text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Experience the difference
            <Sprout className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyPearlGrove;