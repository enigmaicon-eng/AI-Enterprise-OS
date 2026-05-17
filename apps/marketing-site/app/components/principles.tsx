"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const PRINCIPLES = [
  {
    index: "01",
    title: "Governance must be runtime-native.",
    body: "Policy that lives outside execution fails silently. Authority, constraints, and oversight must be woven into every decision path.",
    color: "#818cf8",
  },
  {
    index: "02",
    title: "Memory is infrastructure.",
    body: "Organizational intelligence compounds only when knowledge persists across agents, sessions, and time. Ephemeral context is a ceiling.",
    color: "#34d399",
  },
  {
    index: "03",
    title: "Enterprises are adaptive systems.",
    body: "An organization is not a hierarchy of approvals. It is a living system of feedback, coordination, and emergent behavior.",
    color: "#a78bfa",
  },
  {
    index: "04",
    title: "Coordination requires context.",
    body: "Routing work to the right agent at the right moment demands structural understanding of authority, state, and intent — not pattern matching.",
    color: "#22d3ee",
  },
  {
    index: "05",
    title: "Alignment must be self-verifying.",
    body: "A system that governs itself must apply the same constraints to its own evolution. Alignment that degrades under modification is not alignment.",
    color: "#f472b6",
  },
  {
    index: "06",
    title: "Intelligence compounds over time.",
    body: "Organizational learning is infrastructure. Systems that reflect, retain, and refine their own reasoning build durable institutional intelligence — not ephemeral task execution.",
    color: "#fb923c",
  },
];

export function Principles() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="principles" className="relative py-40 px-6 section-divider overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20"
        >
          <div className="label-tag mb-8">Design Principles</div>
          <h2 className="text-4xl sm:text-[52px] font-semibold tracking-[-0.03em] text-[var(--fg)] leading-[1.06] max-w-lg">
            What this system
            <br />
            <span className="gradient-text">is built on.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border-subtle)]">
          {PRINCIPLES.map((p, i) => (
            <motion.div
              key={p.index}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="principle-card bg-[var(--bg)] p-8 group hover:bg-[var(--bg-card)] relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 w-full h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: p.color }}
              />
              <div className="flex items-start gap-4 mb-6">
                <span className="text-[10px] font-mono tracking-widest text-[var(--fg-subtle)] mt-1 flex-shrink-0">
                  {p.index}
                </span>
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                  style={{ background: p.color }}
                />
              </div>
              <h3 className="text-[var(--fg)] text-[17px] font-medium tracking-[-0.02em] leading-snug mb-4">
                {p.title}
              </h3>
              <p className="text-[var(--fg-muted)] text-sm leading-relaxed group-hover:text-[var(--fg-2)] transition-colors">
                {p.body}
              </p>
            </motion.div>
          ))}

        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="text-[var(--fg-dim)] text-[11px] font-mono mt-6 text-right"
        >
          These are not aspirations — they are constraints on every design decision in this system.
        </motion.p>
      </div>
    </section>
  );
}
