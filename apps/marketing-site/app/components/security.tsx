"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const PILLARS = [
  {
    icon: <ZeroTrustIcon />,
    title: "Zero Trust Architecture",
    body: "Every request is verified. No standing permissions. Zero Standing Privilege enforced for all 144 agents. JIT access with 90-day TTL drift tracking and automatic credential rotation.",
    tags: ["ZSP", "JIT Access", "mTLS", "RBAC"],
    color: "amber",
  },
  {
    icon: <AdversarialIcon />,
    title: "Adversarial Cognition Defense",
    body: "Five defense layers against AI-specific attacks: prompt injection, memory poisoning, strategic manipulation, coordination attacks, and recursive exploits. Constitutional proximity bypass is non-suppressable.",
    tags: ["Prompt Injection Detection", "Memory Integrity", "Behavioral Anomaly"],
    color: "red",
  },
  {
    icon: <SovereignIcon />,
    title: "Sovereign Cognition",
    body: "Six jurisdiction-aware memory partitions with differential privacy (ε ≤ 1.0). China operations permanently HARD isolated. Data sovereignty enforcement at every layer of the cognitive stack.",
    tags: ["6 Jurisdictions", "ε ≤ 1.0 DP", "k-anon k≥10", "Hard Isolation"],
    color: "purple",
  },
  {
    icon: <IdentityIcon />,
    title: "Identity & Access Management",
    body: "IAM posture score 0-100 with continuous certification. 10 ITD rules for insider threat detection. Ed25519 hash-chained audit trails. Emergency break-glass with 15-minute TTL.",
    tags: ["Ed25519 Signing", "ITD Rules", "PAM", "Continuous Audit"],
    color: "blue",
  },
];

const colorMap: Record<string, { border: string; bg: string; tag: string; icon: string; glow: string }> = {
  amber:  { border: "border-amber-500/15",  bg: "bg-amber-500/[0.05]",  tag: "text-amber-400 bg-amber-500/10 border-amber-500/20",  icon: "text-amber-400",  glow: "from-amber-500/5" },
  red:    { border: "border-red-500/15",    bg: "bg-red-500/[0.05]",    tag: "text-red-400 bg-red-500/10 border-red-500/20",        icon: "text-red-400",    glow: "from-red-500/5" },
  purple: { border: "border-purple-500/15", bg: "bg-purple-500/[0.05]", tag: "text-purple-400 bg-purple-500/10 border-purple-500/20",icon: "text-purple-400", glow: "from-purple-500/5" },
  blue:   { border: "border-blue-500/15",   bg: "bg-blue-500/[0.05]",   tag: "text-blue-400 bg-blue-500/10 border-blue-500/20",     icon: "text-blue-400",   glow: "from-blue-500/5" },
};

export function Security() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="security" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/10 to-transparent" />

      {/* Background accent */}
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full opacity-[0.03] blur-[100px] bg-red-500 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 border border-red-500/20 rounded-full px-3 py-1 mb-6 bg-red-500/[0.05]">
            <span className="text-red-400 text-xs font-mono tracking-widest uppercase">Security & Resilience</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-5">
            Defense in depth.
            <br />
            <span className="gradient-text-warm">Built into the substrate.</span>
          </h2>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            Not bolted on. Not an afterthought. Security is woven into the constitutional fabric —
            every agent, every operation, every governance checkpoint.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {PILLARS.map((pillar, i) => {
            const c = colorMap[pillar.color] ?? colorMap.blue;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative border ${c.border} ${c.bg} rounded-2xl p-6 overflow-hidden hover:scale-[1.01] transition-transform duration-300`}
              >
                <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-30 bg-gradient-to-bl ${c.glow} to-transparent pointer-events-none`} />

                <div className={`flex items-center gap-3 mb-4 ${c.icon}`}>
                  {pillar.icon}
                  <h3 className="text-white font-semibold text-base tracking-tight">{pillar.title}</h3>
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed mb-4">{pillar.body}</p>
                <div className="flex flex-wrap gap-1.5">
                  {pillar.tags.map((tag) => (
                    <span key={tag} className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${c.tag}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Security posture banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="border border-white/[0.06] rounded-2xl bg-white/[0.02] p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div>
            <div className="text-white font-semibold text-lg mb-1">Security posture: Verified</div>
            <div className="text-zinc-500 text-sm">
              21 append-only audit JSONL files · Hash-chained integrity · Continuous constitutional verification
            </div>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Audit Coverage", value: "100%" },
              { label: "Threat Rules", value: "50+" },
              { label: "IAM Posture", value: "98/100" },
            ].map((metric) => (
              <div key={metric.label} className="text-center">
                <div className="text-white text-xl font-semibold tabular-nums">{metric.value}</div>
                <div className="text-zinc-600 text-[10px] font-mono">{metric.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ZeroTrustIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1L16 4.5V9.5C16 13 12.866 16 9 16C5.134 16 2 13 2 9.5V4.5L9 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 5V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="9" cy="11" r="0.75" fill="currentColor"/></svg>;
}
function AdversarialIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L3 5.5V9.5C3 12.5 5.686 15.2 9 16C12.314 15.2 15 12.5 15 9.5V5.5L9 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6.5 7.5L11.5 12.5M11.5 7.5L6.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
}
function SovereignIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><ellipse cx="9" cy="9" rx="7" ry="7" stroke="currentColor" strokeWidth="1.3"/><path d="M2 9H16M9 2C7 5 6 7 6 9C6 11 7 13 9 16M9 2C11 5 12 7 12 9C12 11 11 13 9 16" stroke="currentColor" strokeWidth="1.3"/></svg>;
}
function IdentityIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M3 16C3 13.239 5.686 11 9 11C12.314 11 15 13.239 15 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M12 4L13.5 5.5L16 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
