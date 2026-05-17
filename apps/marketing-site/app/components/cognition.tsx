"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTheme } from "./theme-provider";

const CAPABILITIES = [
  {
    label: "Persistent knowledge graph",
    body: "Every decision and insight becomes a node — growing the organization's intelligence over time rather than resetting with each session.",
  },
  {
    label: "Multi-horizon reasoning",
    body: "Market, operational, and competitive signals synthesized simultaneously across planning horizons.",
  },
  {
    label: "Organizational learning",
    body: "The system reflects on execution cycles, refines heuristics within governance bounds, and encodes durable institutional knowledge that compounds across agent generations.",
  },
  {
    label: "Enterprise simulation",
    body: "Decisions validated against digital twin models of the organization before they're made at scale.",
  },
];

const GRAPH_NODES = [
  { cx: 50, cy: 50, r: 5.5, primary: true },
  { cx: 82, cy: 22, r: 3.5, primary: false },
  { cx: 88, cy: 65, r: 4,   primary: false },
  { cx: 16, cy: 22, r: 3.5, primary: false },
  { cx: 20, cy: 72, r: 3.5, primary: false },
  { cx: 55, cy: 85, r: 3,   primary: false },
  { cx: 35, cy: 10, r: 2.5, primary: false },
];

const EDGES = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,2],[3,6],[4,5]];

export function Cognition() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const edgeStroke = isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.22)";
  const cardBg = isDark
    ? "rgba(99,102,241,0.05)"
    : "rgba(99,102,241,0.04)";
  const cardBorder = isDark
    ? "rgba(99,102,241,0.12)"
    : "rgba(99,102,241,0.14)";

  return (
    <section id="cognition" className="relative py-40 px-6 section-divider overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="label-tag mb-8">Adaptive Intelligence</div>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--fg)] mb-6 leading-[1.07]">
              The enterprise
              <br />
              <span className="gradient-text">learns continuously.</span>
            </h2>
            <p className="text-[var(--fg-muted)] text-lg leading-relaxed mb-12">
              A live model of the organization — one that reflects on its own
              execution, retains what it learns, and evolves its reasoning
              within governance-enforced bounds.
            </p>

            <div className="space-y-6">
              {CAPABILITIES.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.09 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500 mt-1 self-stretch opacity-40" />
                  <div>
                    <div className="text-[var(--fg-2)] text-sm font-medium mb-1">{c.label}</div>
                    <div className="text-[var(--fg-muted)] text-sm leading-relaxed">{c.body}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: graph */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-sm mx-auto">
              <div
                className="absolute inset-0 rounded-3xl border"
                style={{ background: cardBg, borderColor: cardBorder, boxShadow: `0 0 100px ${isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)"}` }}
              />

              <svg viewBox="0 0 100 100" className="absolute inset-8" fill="none">
                {EDGES.map(([a, b], i) => (
                  <motion.line
                    key={i}
                    x1={GRAPH_NODES[a].cx} y1={GRAPH_NODES[a].cy}
                    x2={GRAPH_NODES[b].cx} y2={GRAPH_NODES[b].cy}
                    stroke={edgeStroke}
                    strokeWidth="0.5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                    transition={{ duration: 1.2, delay: 0.4 + i * 0.08 }}
                  />
                ))}

                {[[0,1],[0,2],[0,3],[0,4]].map(([a, b], i) => (
                  <motion.circle
                    key={`f-${i}`}
                    r="1.2"
                    fill="#818cf8"
                    fillOpacity="0.9"
                    initial={{ cx: GRAPH_NODES[a].cx, cy: GRAPH_NODES[a].cy, opacity: 0 }}
                    animate={inView ? {
                      cx: [GRAPH_NODES[a].cx, GRAPH_NODES[b].cx, GRAPH_NODES[a].cx],
                      cy: [GRAPH_NODES[a].cy, GRAPH_NODES[b].cy, GRAPH_NODES[a].cy],
                      opacity: [0, 0.9, 0],
                    } : {}}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 + i * 0.7, ease: "easeInOut" }}
                  />
                ))}

                {GRAPH_NODES.map((n, i) => (
                  <g key={i}>
                    {n.primary && (
                      <motion.circle
                        cx={n.cx} cy={n.cy} r={n.r + 4}
                        fill="rgba(99,102,241,0.08)"
                        animate={inView ? { r: [n.r + 4, n.r + 7, n.r + 4] } : {}}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    <motion.circle
                      cx={n.cx} cy={n.cy} r={n.r}
                      fill={n.primary ? "rgba(99,102,241,0.7)" : "rgba(99,102,241,0.4)"}
                      stroke={n.primary ? "#818cf8" : "rgba(129,140,248,0.3)"}
                      strokeWidth="0.5"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={inView ? { scale: 1, opacity: 1 } : {}}
                      transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                    />
                  </g>
                ))}
              </svg>

              <div className="absolute bottom-6 right-6 text-right">
                <div className="text-[var(--fg)] text-lg font-semibold">10M+</div>
                <div className="text-[var(--fg-subtle)] text-[10px] font-mono">knowledge nodes</div>
              </div>
              <div className="absolute top-6 left-6">
                <div className="text-[var(--fg)] text-lg font-semibold">342ms</div>
                <div className="text-[var(--fg-subtle)] text-[10px] font-mono">synthesis latency</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
