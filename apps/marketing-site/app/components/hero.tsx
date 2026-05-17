"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 grid-bg" />

      {/* Center glow — reduced in light mode via CSS var */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[560px] rounded-full opacity-[0.07] dark:opacity-[0.08] blur-[140px] bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-700 animate-gradient" />
      </div>

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,var(--bg)_100%)] pointer-events-none" />

      {/* Orbital rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none">
        <div className="absolute inset-0 rounded-full border border-[var(--border-subtle)] animate-orbit-cw" />
        <div className="absolute inset-[80px] rounded-full border border-indigo-500/[0.05] animate-orbit-ccw" />
      </div>

      <motion.div
        style={{ opacity, y }}
        className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center"
      >
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="label-tag mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-soft" />
          Enterprise Intelligence Runtime
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="text-[60px] sm:text-[80px] lg:text-[100px] font-semibold tracking-[-0.04em] leading-[0.92] text-[var(--fg)] mb-8"
        >
          The Enterprise
          <br />
          <span className="gradient-text">Operating System</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.34 }}
          className="text-[var(--fg-muted)] text-[17px] sm:text-[19px] leading-relaxed max-w-[460px] mb-12"
        >
          Persistent memory. Structured governance.
          Coordinated intelligence — built for operational scale.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.48 }}
          className="flex flex-col sm:flex-row items-center gap-3 mb-28"
        >
          <a
            href="https://github.com/enigmaicon-eng/AI-Enterprise-OS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-[var(--fg)] text-[var(--bg)] text-sm font-medium px-6 py-3 rounded-full hover:opacity-85 transition-opacity shadow-xl shadow-black/10"
          >
            <GithubIcon className="w-4 h-4" />
            View on GitHub
          </a>
          <a
            href="#architecture"
            className="flex items-center gap-2 border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] text-sm font-medium px-6 py-3 rounded-full hover:bg-[var(--bg-card-hover)] hover:text-[var(--fg)] transition-all"
          >
            Explore Architecture
          </a>
          <a
            href="#vision"
            className="text-[var(--fg-subtle)] hover:text-[var(--fg-muted)] text-sm px-4 py-3 transition-colors"
          >
            Read the Vision →
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="flex items-center gap-12 sm:gap-20"
        >
          {[
            { n: "50+",  label: "Enterprise connectors" },
            { n: "144",  label: "Coordinated agents" },
            { n: "∞",    label: "Organizational memory" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-[var(--fg)] text-[26px] font-semibold tracking-tight tabular-nums leading-none">{s.n}</div>
              <div className="text-[var(--fg-subtle)] text-[11px] font-mono mt-2 tracking-wide">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-9 bg-gradient-to-b from-[var(--fg-subtle)] to-transparent"
        />
      </motion.div>
    </section>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}
