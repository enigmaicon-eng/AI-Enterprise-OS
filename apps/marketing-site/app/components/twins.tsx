"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const SIMULATIONS = [
  {
    icon: <MarketIcon />,
    label: "Market Digital Twin",
    headline: "Real-time market simulation",
    body: "Six perturbation types. Compound scenario simulation. 1,000 Monte Carlo runs per analysis cycle. The enterprise always knows what the market will do before it does it.",
    metrics: [
      { label: "Monte Carlo runs", value: "1,000" },
      { label: "Perturbation types", value: "6" },
      { label: "Forecast horizon", value: "24mo" },
    ],
    color: "blue",
  },
  {
    icon: <OrgTwinIcon />,
    label: "Organizational Twin",
    headline: "Team and workflow modeling",
    body: "A live model of every team, workflow, dependency, and bottleneck in the organization. Predict the impact of structural changes before they happen.",
    metrics: [
      { label: "Org metrics tracked", value: "24" },
      { label: "Dependency maps", value: "Real-time" },
      { label: "Bottleneck detection", value: "< 5min" },
    ],
    color: "purple",
  },
  {
    icon: <ScenarioIcon />,
    label: "Strategic Foresight Engine",
    headline: "Scenario planning at scale",
    body: "Eight scenario types. Compound perturbation modeling. War gaming against adversarial strategies. Executive-ready packages with signal-to-noise ratio under 0.1.",
    metrics: [
      { label: "Scenario types", value: "8" },
      { label: "Executive packages", value: "Auto-generated" },
      { label: "Signal accuracy", value: "94.2%" },
    ],
    color: "cyan",
  },
];

const colorMap: Record<string, { icon: string; border: string; bg: string; metric: string; bar: string }> = {
  blue:   { icon: "text-blue-400",   border: "border-blue-500/15",   bg: "bg-blue-500/[0.06]",   metric: "text-blue-300", bar: "bg-blue-500" },
  purple: { icon: "text-purple-400", border: "border-purple-500/15", bg: "bg-purple-500/[0.06]", metric: "text-purple-300", bar: "bg-purple-500" },
  cyan:   { icon: "text-cyan-400",   border: "border-cyan-500/15",   bg: "bg-cyan-500/[0.06]",   metric: "text-cyan-300", bar: "bg-cyan-500" },
};

export function Twins() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 dot-bg opacity-40" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 border border-cyan-500/20 rounded-full px-3 py-1 mb-6 bg-cyan-500/[0.05]">
            <span className="text-cyan-400 text-xs font-mono tracking-widest uppercase">Digital Twins & Foresight</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-5">
            The enterprise simulates itself
            <br />
            <span className="gradient-text">before it acts</span>
          </h2>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            Live digital twins of market, organization, and strategy.
            Monte Carlo foresight. Compound scenario modeling.
            Executive intelligence delivered automatically.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {SIMULATIONS.map((sim, i) => {
            const c = colorMap[sim.color] ?? colorMap.blue;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative border ${c.border} ${c.bg} rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:scale-[1.01]`}
              >
                {/* Animated chart visualization */}
                <div className="relative h-24 mb-5 overflow-hidden rounded-xl border border-white/[0.04] bg-black/20">
                  <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                    {/* Grid lines */}
                    {[15, 30, 45].map((y) => (
                      <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
                    ))}
                    {/* Main chart area */}
                    <motion.path
                      d={i === 0
                        ? "M0,45 C20,40 40,20 60,25 C80,30 100,15 120,18 C140,21 160,35 180,28 L200,22 L200,60 L0,60 Z"
                        : i === 1
                        ? "M0,50 C30,45 50,30 70,35 C90,40 110,20 130,15 C150,10 170,25 200,20 L200,60 L0,60 Z"
                        : "M0,40 C25,35 50,45 75,30 C100,15 125,25 150,18 C165,14 185,30 200,25 L200,60 L0,60 Z"
                      }
                      fill={`url(#grad${i})`}
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
                    />
                    <motion.path
                      d={i === 0
                        ? "M0,45 C20,40 40,20 60,25 C80,30 100,15 120,18 C140,21 160,35 180,28 L200,22"
                        : i === 1
                        ? "M0,50 C30,45 50,30 70,35 C90,40 110,20 130,15 C150,10 170,25 200,20"
                        : "M0,40 C25,35 50,45 75,30 C100,15 125,25 150,18 C165,14 185,30 200,25"
                      }
                      fill="none"
                      stroke={i === 0 ? "#3b82f6" : i === 1 ? "#8b5cf6" : "#06b6d4"}
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      animate={inView ? { pathLength: 1 } : {}}
                      transition={{ duration: 1.5, delay: 0.4 + i * 0.2 }}
                    />
                    <defs>
                      <linearGradient id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={i === 0 ? "#3b82f6" : i === 1 ? "#8b5cf6" : "#06b6d4"} stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Live indicator */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
                    <span className="text-[9px] font-mono text-zinc-600">LIVE</span>
                  </div>
                </div>

                <div className={`flex items-center gap-2.5 mb-3 ${c.icon}`}>
                  {sim.icon}
                  <span className="text-[11px] font-mono tracking-widest uppercase text-zinc-500">{sim.label}</span>
                </div>
                <h3 className="text-white font-semibold text-lg tracking-tight mb-2">{sim.headline}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-5">{sim.body}</p>

                <div className="grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-4">
                  {sim.metrics.map((m, j) => (
                    <div key={j} className="text-center">
                      <div className={`text-sm font-semibold tabular-nums ${c.metric}`}>{m.value}</div>
                      <div className="text-zinc-700 text-[10px] font-mono leading-tight mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MarketIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12L5.5 7.5L8.5 10L12 4.5L14 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 3V6H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function OrgTwinIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="5" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="10" y="4" width="5" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" strokeDasharray="1.5 1"/><path d="M6 8.5H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
}
function ScenarioIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8H5M8 2V5M14 8H11M8 11V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 5.5L3 3M12.5 5.5L15 3M12.5 10.5L15 13M5.5 10.5L3 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.4"/></svg>;
}
