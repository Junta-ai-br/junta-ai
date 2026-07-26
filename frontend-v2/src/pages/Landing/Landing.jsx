import Hero from './sections/Hero';
import Problem from './sections/Problem';
import Solution from './sections/Solution';
import Features from './sections/Features';
import Showcase from './sections/Showcase';
import Testimonials from './sections/Testimonials';
import FAQ from './sections/FAQ';
import CTA from './sections/CTA';

import './Landing.css';

export default function Landing() {
  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <Showcase />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}