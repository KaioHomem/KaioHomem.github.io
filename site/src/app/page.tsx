import { Intro } from "@/features/intro/Intro";
import { Hero } from "@/features/hero/Hero";
import { Manifesto } from "@/features/manifesto/Manifesto";
import { Work } from "@/features/work/Work";
import { About } from "@/features/about/About";
import { Stack } from "@/features/stack/Stack";
import { Journey } from "@/features/journey/Journey";
import { Contact } from "@/features/contact/Contact";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Intro />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Manifesto />
        <Work />
        <About />
        <Stack />
        <Journey />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
