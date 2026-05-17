"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const GAPS = [
  {
    n: "01",
    title: "Static systems, dynamic AI",
    body: "Enterprise software was built for deterministic workflows. AI outputs are probabilistic. The gap between them is where coordination fails.",
  },
  {
    n: "02",
    title: "Copilot proliferation",
    body: "Teams accumulate isolated AI tools. Each one optimizes locally. None share context. None coordinate. The organization gets smarter in fragments.",
  },
  {
    n: "03",
    title: "Memory doesn't compound",
    body: "Every session resets. Insights evaporate. Decisions leave no trace the next system can reason from. The enterprise learns nothing it can act on.",
  },
  {
    n: "04",
    title: "Governance as afterthought",
    body: "AI systems are deployed without authority structures, override mechanisms, or audit trails. When they act consequentially, there's no framework to validate or reverse them.",
  },
  {
    n: "05",
    title: "No coordination layer",
    body: "Multi-agent work requires runtime primitives — delegation, trust, sequencing, failure recovery — that enterprises don't yet have as infrastructure.",
  },
];

export function WhyNow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-40 px-6 section-divider overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-16 lg:gap-24 items-start">

          {/* Left — sticky header */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:sticky lg:top-32"
          >
            <div className="label-tag mb-8">Why Now</div>
            <h2 className="text-4xl sm:text-[50px] font-semibold tracking-[-0.03em] text-[var(--fg)] leading-[1.06] mb-6">
              The infrastructure
              <br />
              <span className="gradient-text">gap.</span>
            </h2>
            <p className="text-[var(--fg-muted)] text-base leading-relaxed max-w-xs">
              Enterprise AI is not a tooling problem.
              It is an infrastructure problem that no existing platform solves.
            </p>
          </motion.div>

          {/* Right — gap list */}
          <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
            {GAPS.map((gap, i) => (
              <motion.div
                key={gap.n}
                initial={{ opacity: 0, y: 14 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group flex gap-6 py-7 hover:bg-[var(--bg-card)] -mx-4 px-4 rounded-xl transition-colors duration-200"
              >
                <span className="text-[10px] font-mono text-[var(--fg-subtle)] mt-1 flex-shrink-0 w-6">
                  {gap.n}
                </span>
                <div>
                  <h3 className="text-[var(--fg-2)] text-[15px] font-medium tracking-tight mb-1.5 group-hover:text-[var(--fg)] transition-colors">
                    {gap.title}
                  </h3>
                  <p className="text-[var(--fg-muted)] text-sm leading-relaxed">{gap.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
