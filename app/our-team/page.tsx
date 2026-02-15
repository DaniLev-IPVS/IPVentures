"use client";

import { useState } from "react";
import {
  Navigation,
  NavigationOverlay,
  DotGridBackground,
  Footer,
} from "@/components/layout";
import {
  TeamAbout,
  TeamGrid,
  HiringSection,
} from "@/components/sections/our-team";

export default function OurTeam() {
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
        <TeamAbout />
        <TeamGrid />
        <HiringSection />
        <Footer />
      </main>
    </>
  );
}
