"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useMemo } from "react";

const AGENT_GROUPS = [
  { label: "Strategy & Intelligence", count: 18, color: "#3b82f6" },
  { label: "Architecture & Design", count: 14, color: "#8b5cf6" },
  { label: "Engineering & Delivery", count: 22, color: "#06b6d4" },
  { label: "QA & Security", count: 16, color: "#10b981" },
  { label: "Analytics & Data", count: 19, color: "#f59e0b" },
  { label: "Governance & Compliance", count: 15, color: "#f87171" },
  { label: "Research & Intelligence", count: 12, color: "#a78bfa" },
  { label: "Operations & Infrastructure", count: 28, color: "#34d399" },
];

const ORG_STATS = [
  { value: "144", label: "Specialized Agents", sub: "across 17 orgs" },
  { value: "49", label: "Integrated Systems", sub: "real-time connected" },
  { value: "< 45s", label: "Failover Time", sub: "HA orchestrator" },
  { value: "99.97%", label: "Uptime SLA", sub: "constitutional gate" },
];

export function Swarm() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const nodes = useMemo(() => {
    const result: { x: number; y: number; r: number; color: string; delay: number }[] = [];
    AGENT_GROUPS.forEach((group, gi) => {
      const angleBase = (gi / AGENT_GROUPS.length) * Math.PI * 2;
      const outerR = 38;
      const gx = 50 + outerR * Math.cos(angleBase);
      const gy = 50 + outerR * Math.sin(angleBase);

      // Hub node
      result.push({ x: gx, y: gy, r: 2.5, color: group.color, delay: gi * 0.1 });

      // Cluster nodes
      const spread = Math.min(group.count, 8);
      for (let j = 0; j < spread; j++) {
        const spreadAngle = angleBase + (j - spread / 2) * 0.18;
        const d = 10 + Math.random() * 6;
        result.push({
          x: gx + d * Math.cos(spreadAngle + Math.PI / 2),
          y: gy + d * Math.sin(spreadAngle + Math.PI / 2),
          r: 1,
          color: group.color,
          delay: gi * 0.1 + j * 0.05,
        });
      }
    });
    return result;
  }, []);

  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: network visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.9 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 rounded-3xl border border-blue-500/[0.08] bg-gradient-to-br from-blue-500/[0.04] to-purple-500/[0.02]" />
              <div className="absolute inset-0 rounded-3xl glow-blue opacity-50" />

              <svg viewBox="0 0 100 100" className="absolute inset-4" fill="none">
                {/* Central node */}
                <motion.circle
                  cx="50" cy="50" r="6"
                  fill="rgba(59, 130, 246, 0.15)"
                  stroke="#3b82f6"
                  strokeWidth="0.5"
                  animate={inView ? { r: [6, 7.5, 6], opacity: [0.6, 1, 0.6] } : {}}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.circle
                  cx="50" cy="50" r="3"
                  fill="#3b82f6"
                  initial={{ scale: 0 }}
                  animate={inView ? { scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />

                {/* Hub spokes */}
                {AGENT_GROUPS.map((group, gi) => {
                  const angle = (gi / AGENT_GROUPS.length) * Math.PI * 2;
                  const outerR = 38;
                  const hx = 50 + outerR * Math.cos(angle);
                  const hy = 50 + outerR * Math.sin(angle);
                  return (
                    <motion.line
                      key={gi}
                      x1="50" y1="50"
                      x2={hx} y2={hy}
                      stroke={group.color}
                      strokeWidth="0.4"
                      strokeOpacity="0.3"
                      initial={{ pathLength: 0 }}
                      animate={inView ? { pathLength: 1 } : {}}
                      transition={{ duration: 0.8, delay: 0.5 + gi * 0.07 }}
                    />
                  );
                })}

                {/* Agent nodes */}
                {nodes.map((node, i) => (
                  <motion.circle
                    key={i}
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill={node.color}
                    fillOpacity={node.r > 1.5 ? 0.8 : 0.5}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={inView ? {
                      scale: 1,
                      opacity: 1,
                    } : {}}
                    transition={{ duration: 0.3, delay: 0.6 + node.delay }}
                  />
                ))}

                {/* Animated data pulses */}
                {AGENT_GROUPS.map((group, gi) => {
                  const angle = (gi / AGENT_GROUPS.length) * Math.PI * 2;
                  const outerR = 38;
                  const hx = 50 + outerR * Math.cos(angle);
                  const hy = 50 + outerR * Math.sin(angle);
                  return (
                    <motion.circle
                      key={`pulse-${gi}`}
                      r="1.2"
                      fill={group.color}
                      fillOpacity="0.9"
                      initial={{ cx: 50, cy: 50, opacity: 0 }}
                      animate={inView ? {
                        cx: [50, hx, 50],
                        cy: [50, hy, 50],
                        opacity: [0, 1, 0],
                      } : {}}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        delay: 1.5 + gi * 0.35,
                        ease: "easeInOut",
                      }}
                    />
                  );
                })}
              </svg>

              {/* Label */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <div className="text-zinc-400 text-sm font-medium">Enterprise Orchestration Network</div>
                <div className="text-zinc-700 text-[11px] font-mono mt-0.5">Real-time · Self-coordinating · Constitutional</div>
              </div>
            </div>
          </motion.div>

          {/* Right: content */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 border border-blue-500/20 rounded-full px-3 py-1 mb-6 bg-blue-500/[0.05]">
              <span className="text-blue-400 text-xs font-mono tracking-widest uppercase">Swarm Orchestration</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-6 leading-[1.05]">
              Multi-agent coordination
              <br />
              <span className="gradient-text">at enterprise scale</span>
            </h2>
            <p className="text-zinc-500 text-lg leading-relaxed mb-10">
              144 specialized agents across 17 organizational units coordinate in real time —
              not through rigid scripts, but through constitutional rules, trust contracts,
              and adaptive execution intelligence.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {ORG_STATS.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="border border-white/[0.06] rounded-xl p-4 bg-white/[0.02]"
                >
                  <div className="text-white text-xl font-semibold tabular-nums tracking-tight">{stat.value}</div>
                  <div className="text-zinc-300 text-xs font-medium mt-0.5">{stat.label}</div>
                  <div className="text-zinc-600 text-[10px] font-mono">{stat.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Org groups */}
            <div className="space-y-2">
              {AGENT_GROUPS.map((group, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                  <div className="flex-1 h-px bg-white/[0.04] relative overflow-hidden">
                    <motion.div
                      className="absolute left-0 top-0 h-full"
                      style={{ backgroundColor: group.color, opacity: 0.3 }}
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${(group.count / 28) * 100}%` } : {}}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.06 }}
                    />
                  </div>
                  <span className="text-zinc-500 text-xs font-mono w-6 text-right">{group.count}</span>
                  <span className="text-zinc-600 text-xs min-w-[160px]">{group.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
