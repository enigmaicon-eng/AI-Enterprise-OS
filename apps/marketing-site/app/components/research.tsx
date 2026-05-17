"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const AREAS = [
  {
    id: "cognition",
    title: "Enterprise Cognition",
    body: "Adaptive reasoning architectures — reflection engines, heuristic evolution, strategic memory — that compound organizational intelligence across operational cycles.",
    tag: "active",
    color: "#818cf8",
  },
  {
    id: "coordination",
    title: "Coordination Runtimes",
    body: "Durable execution models, delegation contracts, and sequencing primitives for multi-agent systems at scale.",
    tag: "active",
    color: "#34d399",
  },
  {
    id: "memory",
    title: "Persistent Memory",
    body: "Knowledge lineage, associative retrieval, and organizational continuity across the lifecycle of enterprise decisions.",
    tag: "active",
    color: "#22d3ee",
  },
  {
    id: "governance-ai",
    title: "Governance-Native AI",
    body: "Authority architectures where human oversight is structurally guaranteed — not runtime configuration.",
    tag: "active",
    color: "#a78bfa",
  },
  {
    id: "adaptive",
    title: "Adaptive Policy",
    body: "Policy systems that evolve with regulatory change and organizational context — without breaking invariants.",
    tag: "exploratory",
    color: "#f59e0b",
  },
  {
    id: "intelligence",
    title: "Enterprise Intelligence",
    body: "Compound insight synthesis across business systems and operational telemetry — with traceable reasoning.",
    tag: "exploratory",
    color: "#f472b6",
  },
  {
    id: "org-systems",
    title: "Organizational Systems",
    body: "Enterprises modeled as adaptive systems — with cognitive lineage, governance-aware learning, and longitudinal memory that outlasts any single deployment.",
    tag: "active",
    color: "#10b981",
  },
  {
    id: "runtime-learning",
    title: "Runtime Learning",
    body: "How AI systems can safely improve their own execution patterns — bounded adaptation, auditable heuristic evolution, and institutional knowledge formation at runtime.",
    tag: "active",
    color: "#fb923c",
  },
];

export function Research() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="research" className="relative py-40 px-6 section-divider overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.03] blur-[120px] bg-indigo-500 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="label-tag mb-8">Research Areas</div>
            <h2 className="text-4xl sm:text-[52px] font-semibold tracking-[-0.03em] text-[var(--fg)] leading-[1.06] max-w-md">
              Where the hard
              <br />
              <span className="gradient-text">problems live.</span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[var(--fg-muted)] text-sm max-w-xs lg:text-right leading-relaxed"
          >
            Each area represents an open design problem in building AI systems
            that enterprises can trust at full operational scale.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {AREAS.map((area, i) => (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="group relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-7 hover:border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <div
                  className="w-2 h-2 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
                  style={{ background: area.color }}
                />
                <span
                  className="text-[9px] font-mono tracking-widest uppercase"
                  style={{ color: area.tag === "active" ? "var(--fg-muted)" : "var(--fg-subtle)" }}
                >
                  {area.tag}
                </span>
              </div>

              <h3 className="text-[var(--fg)] text-base font-medium tracking-tight mb-3">
                {area.title}
              </h3>
              <p className="text-[var(--fg-muted)] text-sm leading-relaxed">
                {area.body}
              </p>

              <div
                className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-b-2xl"
                style={{ background: area.color }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
