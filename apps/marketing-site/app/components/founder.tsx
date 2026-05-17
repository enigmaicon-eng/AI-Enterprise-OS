"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const THREADS = [
  "Enterprise systems break at the seams between tools — not inside them.",
  "Most AI in the enterprise is automation with a better interface. The infrastructure problem is unsolved.",
  "The hard question is governance: who decides, on what basis, with what accountability, and what happens when they're wrong.",
];

export function Founder() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="about" className="relative py-40 px-6 section-divider overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-16 lg:gap-24 items-start">

          {/* Left */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:sticky lg:top-32"
          >
            <div className="label-tag mb-10">Why This Exists</div>

            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-[var(--border)] flex items-center justify-center mb-8">
              <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-indigo-400 to-purple-500 opacity-70" />
            </div>

            <h2 className="text-[var(--fg)] text-xl font-semibold tracking-tight mb-1">Charan K.</h2>
            <p className="text-[var(--fg-subtle)] text-sm font-mono">Builder · Systems thinker</p>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-12"
          >
            <div>
              <p className="text-[var(--fg)] text-2xl sm:text-3xl font-medium tracking-[-0.025em] leading-[1.3] mb-6">
                Enterprise software is full of intelligence
                that doesn&apos;t accumulate.
              </p>
              <p className="text-[var(--fg-muted)] text-lg leading-relaxed">
                Every tool thinks in isolation. Every insight evaporates at session end.
                Every AI deployment starts from scratch. This isn&apos;t an AI capability problem —
                it&apos;s an infrastructure problem.
              </p>
            </div>

            <div className="flex flex-col gap-0.5">
              {THREADS.map((thread, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.35 + i * 0.1 }}
                  className="flex gap-4 py-4 border-b border-[var(--border-subtle)] last:border-0"
                >
                  <span className="text-[var(--fg-subtle)] font-mono text-xs mt-1 flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[var(--fg-2)] text-base leading-relaxed">{thread}</p>
                </motion.div>
              ))}
            </div>

            <div className="border-l-2 border-[var(--border)] pl-6">
              <p className="text-[var(--fg-muted)] text-base leading-relaxed mb-4">
                This project comes from working at the intersection of operational systems,
                financial infrastructure, and AI — environments where the cost of bad coordination
                is concrete and immediate, not theoretical.
              </p>
              <p className="text-[var(--fg-subtle)] text-sm leading-relaxed">
                The architecture here is a working attempt to solve the memory, governance, and
                coordination problems that make enterprise AI brittle in practice — including
                the adaptive cognition layer that lets the system learn from its own operational
                history without escaping governance constraints.
              </p>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-[var(--fg-subtle)] text-sm font-mono"
            >
              Built to outlast any single deployment.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
