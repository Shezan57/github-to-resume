/**
 * Landing Page - GitHub to Resume Generator
 */

import { Hero, HowItWorks, Features, Footer } from '@/components/landing';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <HowItWorks />
      <Features />
      <Footer />
    </main>
  );
}
