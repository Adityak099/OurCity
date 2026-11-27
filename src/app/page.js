import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import HowItWorks from "@/components/home/HowItWorks";
import Portals from "@/components/home/Portals";
import Impact from "@/components/home/Impact";
import RecentReports from "@/components/home/RecentReports";

export default function Home() {
  return (
    <main id="main-content" className="home-page">
      <Hero />
      <Features />
      <HowItWorks />
      <Portals />
      <Impact />
      <RecentReports />
    </main>
  );
}
