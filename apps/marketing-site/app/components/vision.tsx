"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Vision() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <section id="vision" ref={sectionRef} className="relative py-48 px-6 section-divider overflow-hidden">
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full opacity-[0.05] dark:opacity-[0.07] blur-[160px] bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 animate-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,transparent_0%,var(--bg)_100%)]" />
      </motion.div>

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="label-tag mb-12 mx-auto w-fit"
        >
          The Vision
        </motion.div>

        <motion.blockquote
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[1.08] text-[var(--fg)] mb-12"
        >
          The enterprise itself
          <br />
          becomes an{" "}
          <span className="gradient-text">adaptive</span>
          <br />
          <span className="gradient-text">intelligence system.</span>
        </motion.blockquote>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-[var(--fg-muted)] text-xl leading-relaxed max-w-xl mx-auto mb-6"
        >
          Not a collection of AI tools. Not a smarter automation layer.
          A fundamentally different category of enterprise infrastructure.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.38 }}
          className="text-[var(--fg-subtle)] text-base max-w-lg mx-auto mb-16"
        >
          Where the organization executes, learns from execution, and compounds
          that learning into permanent institutional intelligence —
          governed by structures that guarantee human authority is never delegated away.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="https://github.com/enigmaicon-eng/AI-Enterprise-OS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[var(--fg)] text-[var(--bg)] text-sm font-medium px-7 py-3.5 rounded-full hover:opacity-85 transition-opacity shadow-xl shadow-black/10"
          >
            <GithubIcon className="w-4 h-4" />
            View on GitHub
          </a>
          <a
            href="#architecture"
            className="border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] text-sm font-medium px-7 py-3.5 rounded-full hover:bg-[var(--bg-card-hover)] hover:text-[var(--fg)] transition-all"
          >
            Explore the Architecture
          </a>
        </motion.div>
      </div>
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
