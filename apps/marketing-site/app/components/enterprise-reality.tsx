"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const USE_CASES = [
  {
    id: "product-ops",
    title: "Product Operations",
    body: "Continuous synthesis of signals across roadmap, delivery, and market — without manual aggregation.",
    icon: "◈",
    color: "#818cf8",
  },
  {
    id: "portfolio",
    title: "Portfolio Intelligence",
    body: "Cross-initiative visibility with dependency tracking, risk scoring, and resource contention surfaced in real time.",
    icon: "◆",
    color: "#34d399",
  },
  {
    id: "executive",
    title: "Executive Briefing",
    body: "Compressed, context-aware briefings built from live operational state — not manually assembled slide decks.",
    icon: "◉",
    color: "#a78bfa",
  },
  {
    id: "governance",
    title: "Governance Workflows",
    body: "Approval chains, authority validation, and audit trails enforced at every consequential decision point.",
    icon: "⬡",
    color: "#f59e0b",
  },
  {
    id: "planning",
    title: "Strategic Planning",
    body: "Scenario simulation, assumption tracking, and assumption-to-outcome lineage across planning cycles.",
    icon: "◇",
    color: "#22d3ee",
  },
  {
    id: "incident",
    title: "Incident Coordination",
    body: "Structured response with evidence collection, escalation routing, and post-incident learning preserved.",
    icon: "△",
    color: "#f472b6",
  },
  {
    id: "memory",
    title: "Organizational Memory",
    body: "Decisions, rationale, and institutional knowledge encoded as permanent organizational memory — with cognitive lineage traceable across agent generations.",
    icon: "○",
    color: "#10b981",
  },
  {
    id: "adaptive-ops",
    title: "Adaptive Operations",
    body: "Routing, delegation, and coordination patterns that improve with observed outcomes — heuristics refined within governance bounds, never outside them.",
    icon: "◎",
    color: "#fb923c",
  },
];

export function EnterpriseReality() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-40 px-6 section-divider overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-[0.04] dark:opacity-[0.03] blur-[120px] bg-indigo-500 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16"
        >
          <div>
            <div className="label-tag mb-8">Enterprise Use Cases</div>
            <h2 className="text-4xl sm:text-[50px] font-semibold tracking-[-0.03em] text-[var(--fg)] leading-[1.06]">
              Where it runs.
            </h2>
          </div>
          <p className="text-[var(--fg-muted)] text-sm max-w-xs leading-relaxed">
            Designed for the operational realities of complex organizations — not demos or prototypes.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border-subtle)] rounded-2xl overflow-hidden">
          {USE_CASES.map((uc, i) => (
            <motion.div
              key={uc.id}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.45, delay: 0.05 + i * 0.05 }}
              className="group bg-[var(--bg)] p-6 hover:bg-[var(--bg-card)] transition-all duration-200 relative overflow-hidden"
            >
              {/* Hover accent */}
              <div
                className="absolute top-0 left-0 w-full h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: uc.color }}
              />

              <div
                className="text-xl mb-5 opacity-30 group-hover:opacity-70 transition-opacity duration-200 font-light"
                style={{ color: uc.color }}
              >
                {uc.icon}
              </div>

              <h3 className="text-[var(--fg-2)] text-[13px] font-medium tracking-tight mb-2 group-hover:text-[var(--fg)] transition-colors">
                {uc.title}
              </h3>
              <p className="text-[var(--fg-muted)] text-[12px] leading-relaxed">
                {uc.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
