import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Cloud, Radio, Sparkles, Vote, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
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
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-base font-semibold tracking-tight">Pollaris</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <Link to="/join" className="hover:text-foreground transition-colors">Join a session</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="font-medium">Log in</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="font-medium rounded-md">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
      <Radio className="h-4 w-4" strokeWidth={2.5} />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-bg absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Real-time that actually feels real-time
          </span>
          <h1 className="mt-8 text-balance text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
            Interactive polling <br className="hidden md:block" />
            <span className="text-muted-foreground">made effortless.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
            Design interactive slides. Share a simple code. Watch answers land as your audience taps.
            Zero refreshes, zero friction.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="rounded-md font-medium px-8">
                Create your first poll <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/join">
              <Button size="lg" variant="outline" className="rounded-md font-medium px-8 bg-background">
                Join with a code
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="mx-auto mt-20 max-w-4xl overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <div className="p-8 md:p-12">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live · Question 2 of 5</p>
                <h3 className="mt-3 text-2xl font-semibold md:text-3xl tracking-tight">
                  What's making you excited this week?
                </h3>
              </div>
              <div className="hidden text-right md:block">
                <p className="font-mono text-2xl font-medium tracking-tight">A7-K3P</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">183 joined</p>
              </div>
            </div>
            <div className="mt-10 space-y-4">
              {[
                ["Shipping something new", 62],
                ["Learning a new skill", 48],
                ["Time with family", 71],
                ["Just the weekend", 22],
              ].map(([label, pct], i) => (
                <div key={label as string} className="relative overflow-hidden rounded-lg bg-muted border border-border/50">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary/10 border-r border-primary/20"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                  />
                  <div className="relative flex items-center justify-between px-5 py-4">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="font-mono text-sm font-medium text-muted-foreground">{pct}%</span>
                  </div>
                </div>
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
    <div className="border-y border-border bg-muted/30 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {items.map((i) => <span key={i}>{i}</span>)}
      </div>
    </div>
  );
}

const features = [
  { icon: Vote, title: "Every poll type you need", body: "Multiple choice, word cloud, ratings, open text — each with its own optimized UI." },
  { icon: Zap, title: "Real-time, actually", body: "Slide changes and votes propagate instantly across every screen. No refresh required." },
  { icon: BarChart3, title: "Beautiful live results", body: "Bars animate, word clouds bloom, ratings tick up. Your audience feels the pulse." },
  { icon: Cloud, title: "Zero setup", body: "Sign in, build slides, share a code. That's it. It just works." },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Features</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Built for the moment you press <span className="text-muted-foreground">Present.</span>
        </h2>
      </div>
      <div className="mt-16 grid gap-6 md:grid-cols-2">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 mb-5">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
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
    <section id="how" className="border-t border-border bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Three steps. Live audience.</h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-card p-8 shadow-sm">
              <p className="font-mono text-sm font-medium text-muted-foreground">{s.n}</p>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <div className="rounded-2xl border border-border bg-card p-12 text-center md:p-20 shadow-sm">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Your next presentation shouldn't be a monologue.</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-lg">Start free. No credit card, no wait list.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/auth"><Button size="lg" className="rounded-md font-medium px-8">Get started</Button></Link>
          <Link to="/join"><Button size="lg" variant="outline" className="rounded-md font-medium px-8 bg-background">Join as audience</Button></Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-muted/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm font-medium text-muted-foreground md:flex-row">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="font-semibold text-foreground">Pollaris</span>
        </div>
        <p>© {new Date().getFullYear()} Pollaris. All rights reserved.</p>
      </div>
    </footer>
  );
}
