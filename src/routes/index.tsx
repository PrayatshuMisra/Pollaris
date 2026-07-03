import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Cloud, Radio, Sparkles, Vote, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="mesh-bg min-h-screen">
      <Nav />
      <Hero />
      <Marquee />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-base font-semibold tracking-tight">Pollaris</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <Link to="/join" className="hover:text-foreground">Join a session</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="rounded-full">Start free</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500">
      <div className="absolute inset-0 opacity-40 blur-lg" />
      <Radio className="relative h-4 w-4 text-white" strokeWidth={2.5} />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Realtime that actually feels realtime
          </span>
          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight md:text-7xl">
            Live polling that
            <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent"> feels alive.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
            Design interactive slides. Share a code. Watch answers land as your audience taps.
            Zero refreshes, zero friction.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="rounded-full">
                Create your first poll <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/join">
              <Button size="lg" variant="outline" className="rounded-full">
                Join with a code
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="glass mx-auto mt-16 max-w-4xl overflow-hidden rounded-3xl p-2"
        >
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 md:p-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Live · Question 2 of 5</p>
                <h3 className="mt-2 text-2xl font-semibold md:text-3xl">
                  What's making you excited this week?
                </h3>
              </div>
              <div className="hidden text-right md:block">
                <p className="font-mono text-2xl">A7-K3P</p>
                <p className="text-xs text-muted-foreground">183 joined</p>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              {[
                ["Shipping something new", 62],
                ["Learning a new skill", 48],
                ["Time with family", 71],
                ["Just the weekend", 22],
              ].map(([label, pct], i) => (
                <motion.div
                  key={label as string}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="relative overflow-hidden rounded-xl bg-white/[0.04] px-4 py-3"
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-fuchsia-500/40 to-violet-500/40"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                  />
                  <div className="relative flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <span className="font-mono text-sm text-muted-foreground">{pct}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ["Universities", "Product teams", "Conferences", "Bootcamps", "Standups", "Workshops", "Classrooms"];
  return (
    <div className="border-y border-white/5 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-6 text-xs uppercase tracking-widest text-muted-foreground">
        {items.map((i) => <span key={i}>{i}</span>)}
      </div>
    </div>
  );
}

const features = [
  { icon: Vote, title: "Every poll type you need", body: "Multiple choice, word cloud, ratings, open text — each with its own optimized UI." },
  { icon: Zap, title: "Realtime, actually", body: "Slide changes and votes propagate instantly across every screen. No refresh." },
  { icon: BarChart3, title: "Beautiful live results", body: "Bars animate, word clouds bloom, ratings tick up. Your audience feels the pulse." },
  { icon: Cloud, title: "Zero setup", body: "Sign in, build slides, share a code. That's it." },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Features</p>
        <h2 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          Built for the moment you press <em className="not-italic bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">Present</em>.
        </h2>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="glass rounded-2xl p-6"
          >
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Build slides", d: "Compose your presentation. Pick a poll type per slide, write the question, done." },
    { n: "02", t: "Share the code", d: "Present. A join code and QR appear. Audience scans or types to join." },
    { n: "03", t: "Watch it happen", d: "Every vote animates in. Advance slides — everyone follows automatically." },
  ];
  return (
    <section id="how" className="border-t border-white/5">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">How it works</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Three steps. Live audience.</h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <p className="font-mono text-sm text-muted-foreground">{s.n}</p>
              <h3 className="mt-4 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="glass rounded-3xl p-10 text-center md:p-16">
        <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Your next presentation shouldn't be a monologue.</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Start free. No credit card, no wait list.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/auth"><Button size="lg" className="rounded-full">Create free account</Button></Link>
          <Link to="/join"><Button size="lg" variant="outline" className="rounded-full">Join as audience</Button></Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2"><Logo /><span>Pollaris</span></div>
        <p>© {new Date().getFullYear()} Pollaris. Built with care.</p>
      </div>
    </footer>
  );
}
