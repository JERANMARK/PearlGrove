import { Sprout, MapPin, Phone, Mail } from 'lucide-react';
import { brandData } from '../data/brand';

const Footer = () => {
  return (
    <footer className="bg-[#152e20] text-cream-50 pt-16 pb-12 border-t border-white/5">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-14">
        <div className="grid md:grid-cols-12 gap-10 lg:gap-14 pb-14">
          
          {/* Left Column: Brand & Tagline */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <Sprout className="w-7 h-7 text-leaf-300" strokeWidth={1.8} />
              <div>
                <h2 className="font-brand text-xl font-semibold tracking-wider leading-none text-cream-50">
                  {brandData.name}
                </h2>
                <p className="font-body text-[8px] text-leaf-300 tracking-[0.25em] mt-1">
                  {brandData.subBrand}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <p className="font-display italic text-2xl sm:text-3xl text-leaf-300 font-normal">
                {brandData.tagline}
              </p>
              <p className="font-body text-xs sm:text-sm text-cream-200/70 mt-2">
                Rooted in Sri Lanka&apos;s hill country. Grown with care.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3 text-cream-200/80">
                <MapPin className="w-4 h-4 text-leaf-300" />
                <span className="font-body text-sm">{brandData.location}</span>
              </div>
              <div className="flex items-center gap-3 text-cream-200/80">
                <Phone className="w-4 h-4 text-leaf-300" />
                <a
                  href={brandData.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm hover:text-leaf-300 transition-colors"
                >
                  {brandData.phone}
                </a>
              </div>
              <div className="flex items-center gap-3 text-cream-200/80">
                <Mail className="w-4 h-4 text-leaf-300" />
                <a
                  href={`mailto:${brandData.email}`}
                  className="font-body text-sm hover:text-leaf-300 transition-colors"
                >
                  {brandData.email}
                </a>
              </div>
            </div>
          </div>

          {/* Middle Columns: Nav Links */}
          <div className="md:col-span-3 grid grid-cols-2 gap-6 pt-1">
            <div className="space-y-3">
              <a href="#about" className="block font-body text-sm text-cream-100/80 hover:text-white transition-colors">
                About
              </a>
              <a href="#growing" className="block font-body text-sm text-cream-100/80 hover:text-white transition-colors">
                Growing
              </a>
              <a href="#contact" className="block font-body text-sm text-cream-100/80 hover:text-white transition-colors">
                Contact
              </a>
            </div>
            <div className="space-y-3">
              <a href="#microgreens" className="block font-body text-sm text-cream-100/80 hover:text-white transition-colors">
                Microgreens
              </a>
              <a href="#for-kitchens" className="block font-body text-sm text-cream-100/80 hover:text-white transition-colors">
                For Business
              </a>
            </div>
          </div>

          {/* Right Column: Founder Info */}
          <div className="md:col-span-4 space-y-4 pt-1">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="font-display text-lg text-cream-50 font-semibold mb-3">Founder</h3>
              <p className="font-body text-cream-200/90 text-sm leading-relaxed">
                Lavanya
              </p>
              <p className="font-body text-cream-200/70 text-xs mt-2 leading-relaxed">
                Passionate about bringing fresh, high-quality microgreens to modern kitchens across Sri Lanka.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-cream-200/50 gap-4">
          <p>© 2026 Pearl Grove Microgreens. All rights reserved.</p>
          <p className="font-brand tracking-wider text-[11px] text-cream-200/40">
            PEARL GROVE · UPCOT, MASKELIYA
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;