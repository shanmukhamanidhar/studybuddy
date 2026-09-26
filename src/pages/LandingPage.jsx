import React from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import Footer from "../components/Footer";

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "var(--color-bg, #0A0A0A)", minHeight: "100vh", color: "var(--color-text, #FAFAFA)", transition: "background-color 0.2s ease, color 0.2s ease" }}>
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
