import Header from "../components/Header";
import Footer from "../components/Footer";
import TimerHero from "../components/TimerHero";
import FeaturesShowcase from "@/components/FeaturesShowcase";
import CallToAction from "@/components/CallToAction";
import WhyCubeDev from "@/components/WhyCubeDev";
import Testimonials from "@/components/Testimonials";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 overflow-x-hidden">
        <TimerHero />
        <FeaturesShowcase />
        {/* <Testimonials /> */}
        <WhyCubeDev />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}