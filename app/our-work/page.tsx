"use client";

import { useState } from "react";
import {
  Navigation,
  NavigationOverlay,
  DotGridBackground,
  Footer,
} from "@/components/layout";
import { OurWorkHero, ProjectList } from "@/components/sections/our-work";

export default function OurWork() {
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
        <OurWorkHero />
        <ProjectList />
        <Footer />
      </main>
    </>
  );
}
