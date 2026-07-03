import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Cloud, PlayCircle, Users, Zap, CheckCircle2, Star, Vote, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function TypewriterLine({ 
  text, 
  className, 
  startTyping, 
  onComplete, 
  showCursor 
}: { 
  text: string, 
  className?: string, 
  startTyping: boolean, 
  onComplete?: () => void, 
  showCursor: boolean 
}) {
  const [charIndex, setCharIndex] = useState(0);
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (!startTyping) return;
    let timeout: NodeJS.Timeout;

    if (charIndex < text.length) {
      // Natural typing speed variance
      const typingSpeed = 60 + Math.random() * 40;
      timeout = setTimeout(() => setCharIndex((c) => c + 1), typingSpeed);
    } else if (charIndex === text.length && !hasCompleted.current) {
      hasCompleted.current = true;
      // Slight pause before signaling completion to move to the next line
      timeout = setTimeout(() => {
        if (onComplete) onComplete();
      }, 300); 
    }

    return () => clearTimeout(timeout);
  }, [startTyping, charIndex, text.length, onComplete]);

  return (
    <div className={`flex items-center min-h-[1.2em] ${className}`}>
      <span>{text.slice(0, charIndex)}</span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: showCursor ? [1, 0, 1] : 0 }}
        transition={showCursor ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0 }}
        className="inline-block w-[0.1em] h-[0.9em] bg-current ml-[2px]"
      />
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen text-black selection:bg-blue-200">
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
    <header className="sticky top-0 z-50 glass border-b border-white/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-xl font-bold tracking-tight">Pollaris</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-800 md:flex">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#how" className="hover:text-blue-600 transition-colors">How it works</a>
          <Link to="/join" className="hover:text-blue-600 transition-colors">Join a session</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="font-medium hover:bg-white/50 rounded-md">Log in</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="font-medium rounded-md bg-black text-white hover:bg-neutral-800 shadow-none px-4">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-white">
      <Radio className="h-4 w-4" strokeWidth={2.5} />
    </div>
  );
}

function Hero() {
  const [typewriterStep, setTypewriterStep] = useState(0);

  return (
    <section className="relative px-6 pb-24 pt-8 md:pt-12 lg:pt-16 mx-auto max-w-6xl flex flex-col lg:flex-row items-center gap-16 lg:gap-12">
      <div className="flex-1 max-w-2xl text-left">
        <h1 className="text-5xl leading-[1.1] font-bold tracking-tight md:text-[5rem] flex flex-col gap-1">
          <TypewriterLine 
            text="Engage." 
            className="text-blue-600" 
            startTyping={true} 
            onComplete={() => setTypewriterStep(1)} 
            showCursor={typewriterStep === 0} 
          />
          <TypewriterLine 
            text="Poll." 
            className="text-orange-500" 
            startTyping={typewriterStep >= 1} 
            onComplete={() => setTypewriterStep(2)} 
            showCursor={typewriterStep === 1} 
          />
          <TypewriterLine 
            text="Inspire." 
            className="text-red-500" 
            startTyping={typewriterStep >= 2} 
            showCursor={typewriterStep >= 2} 
          />
        </h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 0.5 }}
          className="mt-6 max-w-md text-lg text-gray-800 leading-relaxed font-semibold"
        >
          Create interactive polls, engage your audience in real time, and turn every session into an unforgettable experience.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.0, duration: 0.5 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Link to="/auth">
            <Button size="lg" className="rounded-md bg-black hover:bg-neutral-800 text-white px-6 h-12 shadow-none font-medium">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="rounded-md px-6 glass border-white/60 text-black h-12 hover:bg-white/50 shadow-none font-medium">
            See How It Works <PlayCircle className="ml-2 h-4 w-4 text-green-600" />
          </Button>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 0.5 }}
          className="mt-12 flex flex-wrap items-center gap-6 text-sm font-bold text-gray-800"
        >
          <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-orange-500" /> Live Results</div>
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" /> Real-time Engagement</div>
          <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-red-500" /> Actionable Insights</div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        className="flex-1 w-full hidden lg:grid grid-cols-2 gap-4"
      >
        <div className="col-span-2 rounded-lg glass-panel p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
             <div className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">Multiple Choice</div>
             <span className="text-xs font-bold text-gray-500">Question 1</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-black">Which feature do you value the most?</h3>
          <div className="mt-5 space-y-3">
            {[['Ease of use', '48%', 'w-[48%]', 'bg-blue-500'], ['Design', '28%', 'w-[28%]', 'bg-orange-400'], ['Performance', '15%', 'w-[15%]', 'bg-green-500'], ['Support', '9%', 'w-[9%]', 'bg-red-500']].map(([l, p, w, c]) => (
              <div key={l}>
                <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
                  <span>{l}</span><span>{p}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: p }} 
                    transition={{ duration: 1, delay: 1 }}
                    className={`h-full ${w} ${c} rounded-full`} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg glass-panel p-5 shadow-sm border border-gray-100">
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Word Cloud</p>
           <div className="flex flex-wrap gap-1.5 items-center justify-center text-center mt-4">
             <span className="text-blue-600 text-lg font-bold">interactive</span>
             <span className="text-red-500 text-2xl font-black">awesome</span>
             <span className="text-green-600 text-sm font-bold">engaging</span>
             <span className="text-orange-500 text-xs font-bold">simple</span>
           </div>
        </div>
        
        <div className="rounded-lg glass-panel p-5 shadow-sm border border-gray-100">
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Rating</p>
           <p className="text-sm font-bold text-black mb-2">How would you rate your experience?</p>
           <div className="flex gap-1 mb-2">
             {[1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-orange-400 text-orange-400" />)}
             <Star className="h-4 w-4 fill-gray-200 text-gray-200" />
           </div>
           <p className="text-xs font-bold text-gray-800">4.6 Average</p>
        </div>
      </motion.div>
    </section>
  );
}

function Marquee() {
  const items = ["Universities", "Product teams", "Conferences", "Bootcamps", "Standups", "Workshops", "Classrooms"];
  const repeatedItems = [...items, ...items, ...items, ...items, ...items, ...items];

  return (
    <div className="relative border-y border-gray-200 bg-white/50 py-8 overflow-hidden w-full flex">
      {/* Edge Gradients for smooth fade effect */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      
      <motion.div
        className="flex flex-shrink-0 items-center gap-x-12 px-6 w-max text-xs font-bold uppercase tracking-widest text-gray-500"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
      >
        {repeatedItems.map((item, index) => (
          <span key={`${item}-${index}`} className="whitespace-nowrap">
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const features = [
  { icon: Vote, title: "Every poll type you need", body: "Multiple choice, word cloud, ratings, open text — each with its own optimized UI.", tag: "bg-blue-100 text-blue-700" },
  { icon: Zap, title: "Real-time, actually", body: "Slide changes and votes propagate instantly across every screen. No refresh required.", tag: "bg-orange-100 text-orange-700" },
  { icon: BarChart3, title: "Beautiful live results", body: "Bars animate, word clouds bloom, ratings tick up. Your audience feels the pulse.", tag: "bg-red-100 text-red-700" },
  { icon: Cloud, title: "Zero setup", body: "Sign in, build slides, share a code. That's it. It just works.", tag: "bg-green-100 text-green-700" },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Features</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl text-black">
          Built for the moment you press <span className="text-gray-400">Present.</span>
        </h2>
      </div>
      <div className="mt-16 grid gap-6 md:grid-cols-2">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="rounded-lg border border-gray-100 bg-white shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-md mb-5 ${f.tag}`}>
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-black">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed font-medium">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "1", t: "Build slides", d: "Compose your presentation. Pick a poll type per slide, write the question, and customize the look.", icon: Cloud },
    { n: "2", t: "Share the code", d: "Start presenting. A join code and QR appear automatically. Your audience scans or types to join.", icon: Users },
    { n: "3", t: "Watch it happen", d: "Every vote animates in. As you advance slides, everyone's screen follows you automatically.", icon: BarChart3 },
  ];
  return (
    <section id="how" className="border-t border-neutral-100 bg-neutral-50/50">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-neutral-900">Three steps. Live audience.</h2>
          <p className="mt-4 text-lg text-neutral-600">You focus on the presentation. We'll handle the engagement.</p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3 relative">
          {/* Connector Line for Desktop */}
          <div className="hidden md:block absolute top-12 left-24 right-24 h-[1px] bg-neutral-200 z-0" />
          
          {steps.map((s, i) => (
            <div key={s.n} className="relative z-10 flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400">
                  <s.icon className="h-8 w-8" strokeWidth={1.5} />
                </div>
              </div>
              <div className="inline-flex items-center justify-center rounded-full bg-neutral-900 text-white w-6 h-6 text-xs font-bold mb-4">
                {s.n}
              </div>
              <h3 className="text-xl font-bold tracking-tight text-neutral-900 mb-2">{s.t}</h3>
              <p className="text-base text-neutral-600 leading-relaxed max-w-[280px]">{s.d}</p>
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
      <div className="rounded-2xl bg-black p-12 text-center md:p-20 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Your next presentation shouldn't be a monologue.</h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-300 text-base font-medium">Start free. No credit card, no wait list.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/auth"><Button size="lg" className="rounded-md bg-white hover:bg-gray-100 text-black font-semibold px-6 h-11">Get started free</Button></Link>
            <Link to="/join"><Button size="lg" variant="outline" className="rounded-md font-semibold px-6 border-gray-700 bg-transparent text-white h-11 hover:bg-gray-800">Join as audience</Button></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-12 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm font-semibold text-gray-500 md:flex-row">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="font-bold text-black">Pollaris</span>
        </div>
        <p>© {new Date().getFullYear()} Pollaris. All rights reserved.</p>
      </div>
    </footer>
  );
}