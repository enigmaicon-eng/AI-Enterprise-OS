import { Nav } from "./components/nav";
import { Hero } from "./components/hero";
import { Problem } from "./components/problem";
import { WhyNow } from "./components/why-now";
import { Architecture } from "./components/architecture";
import { EnterpriseReality } from "./components/enterprise-reality";
import { Cognition } from "./components/cognition";
import { Governance } from "./components/governance";
import { Principles } from "./components/principles";
import { Research } from "./components/research";
import { Vision } from "./components/vision";
import { Founder } from "./components/founder";
import { Connect } from "./components/connect";
import { Footer } from "./components/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Problem />
        <WhyNow />
        <Architecture />
        <EnterpriseReality />
        <Cognition />
        <Governance />
        <Principles />
        <Research />
        <Vision />
        <Founder />
        <Connect />
      </main>
      <Footer />
    </div>
  );
}
