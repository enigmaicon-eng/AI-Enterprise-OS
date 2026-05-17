"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const PROBLEMS = [
  {
    title: "Fragmented tools",
    body: "AI deployed as disconnected point solutions. No shared context. No coordinated action. Every team has a tool; no one has a system.",
  },
  {
    title: "No persistent memory",
    body: "Insights dissolve at session end. Decisions leave no trace the next system can reason from. Every interaction starts from zero.",
  },
  {
    title: "Action without authority",
    body: "AI systems act without formal structures, override mechanisms, or audit trails. When outcomes are consequential, accountability is unclear.",
  },
];

export function Problem() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-40 px-6 section-divider">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mb-20"
        >
          <div className="label-tag mb-8">The Problem</div>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08] text-[var(--fg)]">
            Enterprise AI has
            <br />a coordination problem.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border-subtle)] rounded-2xl overflow-hidden">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[var(--bg)] p-8 sm:p-10 group hover:bg-[var(--bg-card)] transition-colors duration-200"
            >
              <div className="text-[var(--fg-subtle)] text-[11px] font-mono mb-6 tracking-widest">0{i + 1}</div>
              <h3 className="text-[var(--fg)] text-lg font-medium tracking-tight mb-4">{p.title}</h3>
              <p className="text-[var(--fg-muted)] text-sm leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
