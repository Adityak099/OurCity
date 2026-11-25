"use client";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import Hero from "../../components/home/Hero";
import Features from "../../components/home/Features";
import HowItWorks from "../../components/home/HowItWorks";
import Portals from "../../components/home/Portals";
import Impact from "../../components/home/Impact";

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Portals />
        <Impact />
      </main>

      <Footer />
    </>
  );
}
