import Header from '../components/Header';
import Hero from '../components/Hero';
import AudienceStrip from '../components/AudienceStrip';
import AboutSection from '../components/AboutSection';
import Collection from '../components/Collection';
import GrowingMethod from '../components/GrowingMethod';
import Harvest from '../components/Harvest';
import ForKitchens from '../components/ForKitchens';
import WhyPearlGrove from '../components/WhyPearlGrove';
import MicrogreensBeginning from '../components/MicrogreensBeginning';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <AudienceStrip />
      <AboutSection />
      <Collection />
      <GrowingMethod />
      <Harvest />
      <ForKitchens />
      <WhyPearlGrove />
      <MicrogreensBeginning />
      <Contact />
      <Footer />
    </div>
  );
};

export default Home;