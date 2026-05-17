"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const PRINCIPLES = [
  {
    title: "Human authority is permanent",
    body: "No AI decision overrides human authority. Override takes effect in under 2 seconds at every tier of the system.",
  },
  {
    title: "All actions are explainable",
    body: "Every consequential action carries a complete explanation chain — intent, authority source, and confidence bound.",
  },
  {
    title: "Governance rules are non-bypassable",
    body: "Constraints are enforced at the substrate level. No agent, coordinator, or optimization process can circumvent them.",
  },
  {
    title: "Reversibility is by design",
    body: "Every operation is recorded in cryptographically-chained audit trails. Rollback is available for any action class.",
  },
  {
    title: "Autonomy is earned, not assumed",
    body: "Agents advance through autonomy levels only through demonstrated reliability. Trust accumulates incrementally.",
  },
];

export function Governance() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="governance" className="relative py-40 px-6 section-divider overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.025] dark:opacity-[0.03] blur-[140px] bg-emerald-400 pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-20 items-start">
          {/* Left */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:sticky lg:top-32"
          >
            <div className="label-tag mb-8">Governance</div>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--fg)] mb-6 leading-[1.07]">
              Authority by
              <br />
              design.
            </h2>
            <p className="text-[var(--fg-muted)] text-lg leading-relaxed mb-10">
              Governance isn&apos;t a feature layer. It&apos;s the substrate —
              woven into every agent decision and every autonomous action.
            </p>

            {/* Autonomy levels */}
            <div className="border border-[var(--border)] rounded-2xl p-6 bg-[var(--bg-card)]">
              <div className="text-[var(--fg-subtle)] text-[10px] font-mono tracking-widest uppercase mb-4">
                Autonomy Framework
              </div>
              <div className="space-y-2.5">
                {[
                  { l: 0, label: "Full Manual",   pct: 0,   dim: true },
                  { l: 1, label: "Supervised",    pct: 20 },
                  { l: 2, label: "Conditional",   pct: 40 },
                  { l: 3, label: "Bounded Auto",  pct: 60,  active: true },
                  { l: 4, label: "High Autonomy", pct: 80,  dim: true },
                  { l: 5, label: "Full Auto",     pct: 100, locked: true },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.07 }}
                    className="flex items-center gap-3"
                  >
                    <span className={`text-[10px] font-mono w-4 ${item.active ? "text-emerald-700 dark:text-emerald-400" : item.locked ? "text-[var(--fg-dim)]" : "text-[var(--fg-subtle)]"}`}>
                      L{item.l}
                    </span>
                    <div className="flex-1 h-1 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${item.active ? "bg-emerald-600 dark:bg-emerald-500" : "bg-[var(--fg-dim)]"}`}
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${item.pct}%` } : {}}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.07 }}
                      />
                    </div>
                    <span className={`text-[10px] font-mono min-w-[80px] ${item.active ? "text-emerald-700 dark:text-emerald-400" : item.locked ? "text-[var(--fg-dim)]" : "text-[var(--fg-subtle)]"}`}>
                      {item.label}{item.active && " ←"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: principles */}
          <div className="space-y-1">
            {PRINCIPLES.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                className="group border border-[var(--border-subtle)] hover:border-[var(--border)] rounded-xl p-6 transition-all duration-300 hover:bg-[var(--bg-card)]"
              >
                <div className="flex items-start gap-5">
                  <span className="text-[10px] font-mono text-[var(--fg-subtle)] w-6 flex-shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[var(--fg-2)] font-medium text-sm mb-2 group-hover:text-[var(--fg)] transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-[var(--fg-muted)] text-sm leading-relaxed">{p.body}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.8 }}
              className="pt-4 pl-11 text-[var(--fg-dim)] text-[11px] font-mono"
            >
              Verified continuously · Cryptographically audited · Non-bypassable
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
