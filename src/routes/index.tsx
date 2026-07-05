import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
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
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50">
      <div className="mx-auto flex items-center justify-between px-6 py-3 rounded-full backdrop-blur-2xl bg-white/20 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all">
        <Link to="/" className="flex items-center gap-2 pr-4">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-2 text-sm font-bold text-gray-800 md:flex">
          <a href="#features" className="relative group px-4 py-2 rounded-full transition-all hover:bg-white/30">
            Features
            <span className="absolute left-1/2 bottom-1 h-0.5 w-0 -translate-x-1/2 bg-red-600 transition-all group-hover:w-1/2 rounded-full"></span>
          </a>
          <a href="#how" className="relative group px-4 py-2 rounded-full transition-all hover:bg-white/30">
            How it works
            <span className="absolute left-1/2 bottom-1 h-0.5 w-0 -translate-x-1/2 bg-green-600 transition-all group-hover:w-1/2 rounded-full"></span>
          </a>
          <Link to="/join" className="relative group px-4 py-2 rounded-full transition-all hover:bg-white/30">
            Join a session
            <span className="absolute left-1/2 bottom-1 h-0.5 w-0 -translate-x-1/2 bg-blue-600 transition-all group-hover:w-1/2 rounded-full"></span>
          </Link>
        </nav>
        <div className="flex items-center gap-3 pl-4">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="font-bold text-green-800 hover:text-green-950 hover:bg-green-100/50 rounded-full px-5 transition-all">
              Log in
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="font-bold rounded-full bg-red-700 text-white hover:bg-red-800 shadow-[0_4px_14px_0_rgba(185,28,28,0.39)] px-6 transition-all hover:-translate-y-0.5">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <img src="/logo4.png" alt="Pollaris Logo" className="h-12 object-contain" />
  );
}

function Hero() {
  const [typewriterStep, setTypewriterStep] = useState(0);

  const [pollData, setPollData] = useState([
    { l: 'Ease of use', p: 48, c: 'bg-blue-500' },
    { l: 'Design', p: 28, c: 'bg-orange-400' },
    { l: 'Performance', p: 15, c: 'bg-green-500' },
    { l: 'Support', p: 9, c: 'bg-red-500' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPollData(prev => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        next[idx] = { ...next[idx], p: next[idx].p + Math.floor(Math.random() * 5) + 1 };
        const total = next.reduce((sum, item) => sum + item.p, 0);
        return next.map(item => ({ ...item, p: Math.round((item.p / total) * 100) }));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative px-6 pb-24 pt-23 md:pt-25 lg:pt-28 mx-auto max-w-6xl flex flex-col lg:flex-row items-center gap-16 lg:gap-12">
      <div className="flex-1 max-w-2xl text-left relative z-20">
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
        initial={{ opacity: 0, x: 20, rotateY: -15, rotateX: 10, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, rotateY: -20, rotateX: 15, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.5, type: "spring", bounce: 0.4 }}
        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
        className="flex-1 w-full hidden lg:grid grid-cols-2 gap-5 relative z-10"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          style={{ transform: "translateZ(40px)" }}
          className="col-span-2 rounded-2xl glass-panel p-6 shadow-2xl border border-white/60 bg-white/40"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex rounded-md bg-blue-100/50 px-2.5 py-1 text-xs font-bold text-blue-700 shadow-sm border border-blue-200">Multiple Choice</div>
            <div className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-orange-500 animate-pulse" /><span className="text-xs font-bold text-gray-600 drop-shadow-sm">Live</span></div>
          </div>
          <h3 className="text-xl font-black tracking-tight text-black drop-shadow-sm">Which feature do you value the most?</h3>
          <div className="mt-6 space-y-4">
            <AnimatePresence>
              {pollData.map(({ l, p, c }) => (
                <div key={l} className="relative">
                  <div className="flex justify-between text-xs font-bold text-gray-800 mb-1.5 drop-shadow-sm">
                    <span>{l}</span>
                    <motion.span layout>{p}%</motion.span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white/50 overflow-hidden shadow-inner border border-white/40">
                    <motion.div
                      layout
                      initial={{ width: 0 }}
                      animate={{ width: `${p}%` }}
                      transition={{ type: "spring", bounce: 0.2, duration: 1.2 }}
                      className={`h-full ${c} rounded-full shadow-sm`}
                    />
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 5, delay: 1, ease: "easeInOut" }}
          style={{ transform: "translateZ(60px)" }}
          className="rounded-xl glass-panel p-5 shadow-2xl border border-white/60 bg-white/50"
        >
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2 drop-shadow-sm">Word Cloud</p>
          <div className="flex flex-wrap gap-2 items-center justify-center text-center mt-5">
            <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="text-blue-600 text-lg font-black drop-shadow-sm">interactive</motion.span>
            <span className="text-red-500 text-3xl font-black drop-shadow-sm">awesome</span>
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 4, delay: 1 }} className="text-green-600 text-sm font-black drop-shadow-sm">engaging</motion.span>
            <span className="text-orange-500 text-xs font-bold drop-shadow-sm">simple</span>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 5.5, delay: 2, ease: "easeInOut" }}
          style={{ transform: "translateZ(20px)" }}
          className="rounded-xl glass-panel p-5 shadow-xl border border-white/60 bg-white/40"
        >
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2 drop-shadow-sm">Rating</p>
          <p className="text-sm font-black text-black mb-3 leading-tight drop-shadow-sm">How would you rate your experience?</p>
          <div className="flex gap-1.5 mb-2">
            {[1, 2, 3, 4].map(i => <Star key={i} className="h-5 w-5 fill-orange-400 text-orange-400 drop-shadow-sm" />)}
            <Star className="h-5 w-5 fill-white text-white drop-shadow-sm opacity-80" />
          </div>
          <p className="text-xs font-bold text-gray-700 mt-2">4.6 Average</p>
        </motion.div>
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
  { id: "01", title: "Every poll type you need", body: "Multiple choice, word cloud, ratings, and open text. Each crafted with an optimized, distraction-free interface." },
  { id: "02", title: "Real-time, actually", body: "Slide changes and votes propagate instantly across every screen. No refresh required. It just flows." },
  { id: "03", title: "Beautiful live results", body: "Bars animate smoothly, word clouds bloom, and ratings tick up. Let your audience feel the pulse of the room." },
  { id: "04", title: "Frictionless setup", body: "No downloads required. Sign in, build your slides, and share a code. Your audience joins in seconds." },
];

function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
      {/* Subtle background glow to complement the glass theme */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-50/40 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-2xl relative z-10">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-600 drop-shadow-sm">Features</p>
        <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl text-black">
          Built for the moment <br className="hidden sm:block" />
          you press <span className="text-gray-400">Present.</span>
        </h2>
      </div>
      
      <div className="mt-16 grid gap-6 md:grid-cols-2 lg:gap-8 relative z-10">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            // Changed border-white/60 to border-red-500
            className="group relative overflow-hidden rounded-2xl glass-panel bg-white/40 border border-red-500 p-8 md:p-10 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
          >
            {/* Inner hover gradient for a premium glossy feel */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <span className="text-sm font-black text-gray-300 tracking-widest mb-6 block transition-colors group-hover:text-red-400">
                {f.id}
              </span>
              <h3 className="text-xl font-bold text-black tracking-tight mb-3">
                {f.title}
              </h3>
              <p className="text-base text-gray-700 leading-relaxed font-medium">
                {f.body}
              </p>
            </div>
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
    <footer className="border-t border-white/40 mt-12 glass">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 text-sm font-semibold text-gray-700 md:flex-row">
        <div className="flex items-center gap-3">
          <Logo />
        </div>
        <p className="flex items-center drop-shadow-sm">
          Made with <span className="text-red-500 mx-1.5">❤</span> by Soumi Misra
        </p>
        <p className="text-gray-500">© {new Date().getFullYear()} Pollaris.</p>
      </div>
    </footer>
  );
}