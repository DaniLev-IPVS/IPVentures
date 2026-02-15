"use client";

import { useState } from "react";
import {
  Navigation,
  NavigationOverlay,
  DotGridBackground,
  Footer,
} from "@/components/layout";
import {
  HeroSection,
  VideoSection,
  LiveImpressionsSection,
  RevenueSection,
  ClientsSection,
  PortfolioSection,
  ServicesSection,
  PartnersSection,
  AboutSection,
} from "@/components/sections/home";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <DotGridBackground />
      <Navigation onMenuOpen={() => setMenuOpen(true)} />
      <NavigationOverlay
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <main>
        {/* Screen 1 */}
        <HeroSection />
        {/* Screen 2 */}
        <VideoSection />
        {/* Screen 3 */}
        <LiveImpressionsSection />
        {/* Screen 4 */}
        <RevenueSection />
        {/* Screen 5 */}
        <ClientsSection />
        {/* Screen 6 */}
        <PortfolioSection />
        {/* Screen 7 */}
        <ServicesSection />
        {/* Screen 8 */}
        <PartnersSection />
        {/* Screen 9 */}
        <AboutSection />
        {/* Screen 10 */}
        <Footer />
      </main>
    </>
  );
}
