"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { useTheme } from "./theme-provider";

const R = 70;
const NODES = [
  { id: "cognition",     angle: -90, label: "Adaptive Cognition",   sub: "Longitudinal organizational learning with heuristic evolution, strategic memory, and reasoning history — compounding intelligence across every operational cycle.", color: "#818cf8" },
  { id: "orchestration", angle: -30, label: "Coordination Layer",  sub: "Hundreds of specialized agents coordinated through structured execution contracts.", color: "#34d399" },
  { id: "governance",    angle:  30, label: "Governance Substrate", sub: "Authority structures with immutable human oversight at every execution level.", color: "#a78bfa" },
  { id: "security",      angle:  90, label: "Security Layer",      sub: "Zero-trust architecture, adversarial defense, and sovereign data partitioning.", color: "#f59e0b" },
  { id: "fabric",        angle: 150, label: "Data Fabric",         sub: "Persistent memory, event streams, knowledge lineage, and organizational continuity.", color: "#22d3ee" },
  { id: "integration",   angle: 210, label: "Integration Layer",   sub: "50+ enterprise connectors — APIs, ERPs, event sources, and business systems.", color: "#f472b6" },
];

function polar(angleDeg: number, r: number, cx = 100, cy = 100) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

const POSITIONED = NODES.map((n) => ({ ...n, ...polar(n.angle, R) }));

export function Architecture() {
  const [active, setActive] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const activeNode = POSITIONED.find((n) => n.id === active);
  const { theme } = useTheme();

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "center start"] });
  const headerY = useTransform(scrollYProgress, [0, 1], [24, -12]);

  const isDark = theme === "dark";
  const lineColor = isDark ? "rgba(255,255,255,0.055)" : "rgba(0,0,0,0.07)";
  const centerRingColor = isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.2)";
  const nodeFill = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const nodeStroke = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.10)";
  const dotFill = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.35)";
  const labelColor = isDark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.68)";
  const centerNodeFill = isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.10)";
  const centerNodeStroke = isDark ? "rgba(99,102,241,0.5)" : "rgba(99,102,241,0.35)";
  const runtimeLabel = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.60)";

  return (
    <section id="architecture" ref={sectionRef} className="relative py-40 px-6 section-divider overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.025] dark:opacity-[0.035] blur-[180px] bg-indigo-500 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          ref={ref}
          style={{ y: headerY }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <div className="label-tag mb-8 mx-auto w-fit">System Architecture</div>
          <h2 className="text-4xl sm:text-[52px] font-semibold tracking-[-0.03em] text-[var(--fg)] mb-5 leading-[1.06]">
            One runtime.
            <br />
            <span className="gradient-text">Six integrated layers.</span>
          </h2>
          <p className="text-[var(--fg-muted)] text-lg max-w-md mx-auto">
            Every layer purpose-built. Every layer interconnected.
          </p>
        </motion.div>

        {/* Topology + detail */}
        <div className="flex flex-col xl:flex-row items-center gap-12 xl:gap-20">
          {/* SVG Diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[560px] xl:max-w-[600px] mx-auto xl:mx-0 flex-shrink-0 relative"
          >
            <div className="aspect-square relative">
              {/* Rotating outer rings — three layers of ambient motion */}
              <motion.div
                animate={inView ? { rotate: 360 } : {}}
                transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[2px] rounded-full border border-[var(--border-subtle)]"
              />
              <motion.div
                animate={inView ? { rotate: -360 } : {}}
                transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[40px] rounded-full border border-indigo-500/[0.05]"
              />
              <motion.div
                animate={inView ? { rotate: 360 } : {}}
                transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[20px] rounded-full border border-[var(--border-subtle)] opacity-50"
              />

              {/* viewBox padded by 15px on all sides — prevents label clipping on mobile */}
              <svg viewBox="-15 -15 230 230" fill="none" className="absolute inset-0 w-full h-full">
                {/* Center→node connection lines */}
                {POSITIONED.map((node, i) => (
                  <motion.line
                    key={node.id}
                    x1={100} y1={100}
                    x2={node.x} y2={node.y}
                    stroke={active === node.id ? node.color : lineColor}
                    strokeWidth={active === node.id ? 1 : 0.5}
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                    style={{ transition: "stroke 0.3s ease, stroke-width 0.3s ease" }}
                  />
                ))}

                {/* Ring connections between adjacent nodes */}
                {POSITIONED.map((node, i) => {
                  const next = POSITIONED[(i + 1) % POSITIONED.length];
                  return (
                    <motion.line
                      key={`ring-${node.id}`}
                      x1={node.x} y1={node.y}
                      x2={next.x} y2={next.y}
                      stroke={lineColor}
                      strokeWidth="0.3"
                      strokeDasharray="2 4"
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 0.6 } : {}}
                      transition={{ duration: 1, delay: 0.8 + i * 0.08 }}
                    />
                  );
                })}

                {/* Center→node data pulses */}
                {inView && POSITIONED.map((node, i) => (
                  <motion.circle
                    key={`p-${node.id}`}
                    r="1.8"
                    fill={node.color}
                    initial={{ cx: 100, cy: 100, opacity: 0 }}
                    animate={{
                      cx: [100, node.x, 100],
                      cy: [100, node.y, 100],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: 1.5 + i * 0.65,
                      ease: "easeInOut",
                    }}
                  />
                ))}

                {/* Ring pulses between adjacent nodes */}
                {inView && POSITIONED.map((node, i) => {
                  const next = POSITIONED[(i + 1) % POSITIONED.length];
                  return (
                    <motion.circle
                      key={`rp-${node.id}`}
                      r="1.2"
                      fill={node.color}
                      fillOpacity="0.7"
                      initial={{ cx: node.x, cy: node.y, opacity: 0 }}
                      animate={{
                        cx: [node.x, next.x],
                        cy: [node.y, next.y],
                        opacity: [0, 0.8, 0],
                      }}
                      transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        delay: 4 + i * 0.9,
                        ease: "easeInOut",
                      }}
                    />
                  );
                })}

                {/* Center pulse rings */}
                {[0, 1].map((i) => (
                  <motion.circle
                    key={`ring-${i}`}
                    cx={100} cy={100}
                    r={14}
                    fill="none"
                    stroke={centerRingColor}
                    strokeWidth="0.6"
                    initial={{ r: 14, opacity: 0.6 }}
                    animate={inView ? { r: [14, 28], opacity: [0.5, 0] } : {}}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 1.5, ease: "easeOut" }}
                  />
                ))}

                {/* Center node */}
                <circle cx={100} cy={100} r={10} fill={centerNodeFill} stroke={centerNodeStroke} strokeWidth="0.7"/>
                <motion.circle
                  cx={100} cy={100} r={5}
                  fill="#6366f1"
                  animate={inView ? { r: [5, 5.5, 5] } : {}}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  initial={{ opacity: 0, scale: 0 }}
                  style={{ originX: "100px", originY: "100px" }}
                />
                <motion.text
                  x={100} y={119}
                  textAnchor="middle"
                  fill={runtimeLabel}
                  fontSize="4"
                  fontFamily="monospace"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: 1 }}
                >
                  Runtime Core
                </motion.text>

                {/* Outer nodes */}
                {POSITIONED.map((node, i) => {
                  const isActive = active === node.id;
                  const labelX = node.x + (node.x < 55 ? -14 : node.x > 145 ? 14 : 0);
                  const labelY = node.y + (node.y < 55 ? -14 : node.y > 145 ? 17 : 0);
                  const anchor = node.x < 55 ? "end" : node.x > 145 ? "start" : "middle";

                  return (
                    <g
                      key={node.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setActive(isActive ? null : node.id)}
                    >
                      {isActive && (
                        <motion.circle
                          cx={node.x} cy={node.y} r={10}
                          fill="none"
                          stroke={node.color}
                          strokeWidth="0.6"
                          strokeOpacity="0.5"
                          animate={{ r: [10, 18], opacity: [0.6, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity }}
                        />
                      )}
                      <motion.circle
                        cx={node.x} cy={node.y} r={8.5}
                        fill={isActive ? node.color + "20" : nodeFill}
                        stroke={isActive ? node.color : nodeStroke}
                        strokeWidth="0.6"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={inView ? { scale: 1, opacity: 1 } : {}}
                        transition={{ duration: 0.4, delay: 0.55 + i * 0.09 }}
                        style={{ transition: "fill 0.3s ease, stroke 0.3s ease" }}
                      />
                      <motion.circle
                        cx={node.x} cy={node.y} r={3}
                        fill={isActive ? node.color : dotFill}
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ delay: 0.7 + i * 0.09 }}
                        style={{ transition: "fill 0.3s ease" }}
                      />
                      <motion.text
                        x={labelX} y={labelY}
                        textAnchor={anchor}
                        fill={isActive ? node.color : labelColor}
                        fontSize="4.5"
                        fontWeight="500"
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ delay: 0.85 + i * 0.09 }}
                        style={{ transition: "fill 0.3s ease", fontFamily: "system-ui" }}
                      >
                        {node.label}
                      </motion.text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </motion.div>

          {/* Right panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="flex-1 w-full max-w-xl mx-auto xl:mx-0"
          >
            {activeNode ? (
              <motion.div
                key={activeNode.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border p-8"
                style={{ borderColor: activeNode.color + "28", background: activeNode.color + "07" }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: activeNode.color }} />
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--fg-muted)]">
                    Layer Detail
                  </span>
                </div>
                <h3 className="text-[var(--fg)] text-2xl font-semibold tracking-tight mb-3">{activeNode.label}</h3>
                <p className="text-[var(--fg-muted)] text-base leading-relaxed mb-7">{activeNode.sub}</p>
                <button
                  onClick={() => setActive(null)}
                  className="text-[var(--fg-subtle)] text-xs font-mono hover:text-[var(--fg-muted)] transition-colors"
                >
                  ← Overview
                </button>
              </motion.div>
            ) : (
              <div className="space-y-0.5">
                {POSITIONED.map((node, i) => (
                  <motion.button
                    key={node.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.45, delay: 0.38 + i * 0.07 }}
                    onClick={() => setActive(node.id)}
                    className="w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-xl border border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-card)] transition-all duration-200 group"
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: node.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--fg-muted)] text-sm font-medium group-hover:text-[var(--fg)] transition-colors truncate">
                        {node.label}
                      </div>
                    </div>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0 text-[var(--fg-dim)] group-hover:text-[var(--fg-subtle)] transition-colors">
                      <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.button>
                ))}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: 1 }}
                  className="text-[var(--fg-dim)] text-[11px] font-mono pt-5 pl-4"
                >
                  Select a layer to inspect its role in the runtime
                </motion.p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
