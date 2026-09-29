import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, Zap, Database, ArrowRight, Server, GlobeLock, RefreshCw, Layers, CheckCircle2, AlertCircle, DatabaseBackup, Heart } from 'lucide-react';

const FloatingHeartsBackground = () => {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now() + Math.random();
      const startX = Math.random() * window.innerWidth;
      const endX = startX + (Math.random() * 200 - 100);
      const startY = window.innerHeight + 50;
      const duration = 6 + Math.random() * 4; // 6 to 10 seconds
      const scale = 0.5 + Math.random() * 1;
      
      setHearts(prev => [...prev, { id, startX, endX, startY, duration, scale }]);
      
      setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id !== id));
      }, duration * 1000);
    }, 500); // Generate a new heart every 500ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <AnimatePresence>
        {hearts.map(heart => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 0, y: heart.startY, x: heart.startX, scale: heart.scale }}
            animate={{ 
              opacity: [0, 0.4, 0], 
              y: -100, 
              x: heart.endX
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: heart.duration, ease: "linear" }}
            className="absolute"
            style={{ left: 0, top: 0, filter: 'drop-shadow(0 0 10px rgba(236,72,153,0.5))' }}
          >
            <Heart className="w-8 h-8 fill-pink-500/30 text-pink-500/30" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const LogoAnimated = ({ className = "h-8" }) => (
  <motion.div 
    className={`relative ${className}`}
    whileHover={{ scale: 1.05 }}
  >
    <img src="/orca_icon.png" alt="ORCA Logo" className="h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,246,255,0.6)]" />
  </motion.div>
);

function Navbar({ onOpenDashboard, onOpenSignup }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-navy-900/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'}`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer">
          <LogoAnimated className="h-8" />
          <span className="text-xl font-bold tracking-tight text-white">ORCA</span>
        </div>
        <div className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-300">
          <a href="#problem" className="hover:text-neon-blue transition-colors">Platform</a>
          <a href="#how-it-works" className="hover:text-neon-blue transition-colors">How it Works</a>
          <a href="#features" className="hover:text-neon-blue transition-colors">Features</a>
          <a href="#company" className="hover:text-neon-blue transition-colors">Company</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onOpenDashboard} className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign in</button>
          <button onClick={onOpenSignup} className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-5 py-2 rounded-full text-sm font-medium transition-all hover:shadow-[0_0_15px_rgba(0,246,255,0.3)] hover:border-neon-blue/50">
            Create account
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

function Hero({ onOpenDashboard, onOpenSignup }) {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Animated Grid & Glows */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-neon-blue/20 rounded-full blur-[120px] opacity-40 mix-blend-screen" />
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-neon-purple/20 rounded-full blur-[100px] opacity-30 mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black_10%,transparent_100%)]" />
      </div>

      <motion.div style={{ y: y1, opacity }} className="max-w-7xl mx-auto px-6 relative z-10 w-full grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-neon-blue"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-blue"></span>
            </span>
            Introducing Gateway v2.0
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-6xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40"
          >
            APIs break.<br/>
            <span className="text-glow bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple">
              ORCA adapts.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-slate-400 max-w-xl leading-relaxed font-light"
          >
            The self-healing gateway that detects, diagnoses, and dynamically patches schema mismatches in real-time. Never lose another request to a breaking change.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center gap-4"
          >
            <button onClick={onOpenSignup} className="h-12 px-8 rounded-full bg-white text-navy-900 font-semibold flex items-center gap-2 hover:bg-slate-200 transition-colors">
              Create account <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="h-12 px-8 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors">
              How it works
            </button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, type: 'spring' }}
          className="relative flex justify-center items-center"
        >
          {/* Pulsing rings around logo */}
          <div className="absolute w-[400px] h-[400px] border border-neon-blue/20 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <div className="absolute w-[300px] h-[300px] border border-neon-purple/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
          
          {/* Floating Logo */}
          <motion.img 
            animate={{ y: [-15, 15, -15] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            src="/orca_full.png" 
            alt="ORCA Hero Logo" 
            className="relative z-10 w-full max-w-sm drop-shadow-[0_0_40px_rgba(0,246,255,0.5)]"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

function ProblemSolution() {
  return (
    <section className="py-32 relative z-10" id="problem">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold tracking-tight text-white mb-6">The old way is brittle.</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Traditional API gateways just route traffic. When schemas evolve or microservices drift, requests fail. You spend hours debugging incidents instead of shipping features.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card rounded-3xl p-10 relative overflow-hidden group border-red-500/20"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Dumb Gateways</h3>
            <ul className="space-y-4 text-slate-400">
              <li className="flex items-start gap-3"><span className="text-red-400">✕</span> Strict schema validation drops payloads on minor changes.</li>
              <li className="flex items-start gap-3"><span className="text-red-400">✕</span> Zero context on why a request failed downstream.</li>
              <li className="flex items-start gap-3"><span className="text-red-400">✕</span> Requires manual code updates across consuming clients.</li>
            </ul>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card rounded-3xl p-10 relative overflow-hidden group border-neon-blue/20"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue/0 via-neon-blue/50 to-neon-blue/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-xl bg-neon-blue/10 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-neon-blue" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">ORCA Intelligence</h3>
            <ul className="space-y-4 text-slate-400">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-neon-blue shrink-0" /> Automatically maps old payload fields to new schema fields.</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-neon-blue shrink-0" /> AI infers implicit type conversions (e.g., string to int).</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-neon-blue shrink-0" /> Transparent proxying keeps clients running while you upgrade.</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: <Activity />, title: "Request Intercept", desc: "ORCA sits at the edge, validating incoming requests against the latest downstream spec." },
    { icon: <RefreshCw />, title: "AI Field Mapping", desc: "If a mismatch is detected, ORCA's neural engine predicts the correct schema transformation." },
    { icon: <Zap />, title: "Live Patching", desc: "The payload is restructured on the fly. The request reaches the service, and a warning is logged." }
  ];

  return (
    <section className="py-32 relative z-10 bg-black/20" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold tracking-tight text-white mb-6">Self-Healing Pipeline</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Powered by a specialized LLM trained on millions of API specifications, ORCA understands the intent of the payload, not just the syntax.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              className="relative p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-neon-purple/30 transition-colors"
            >
              <div className="absolute -top-6 left-8 bg-navy-900 border border-white/10 text-neon-purple w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(176,38,255,0.2)]">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-white mt-4 mb-3">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Decorative watermark */}
      <img src="/orca_icon.png" alt="" className="absolute -right-20 top-20 h-96 opacity-5 pointer-events-none rotate-12" />
    </section>
  );
}

function Features() {
  const features = [
    { title: "Zero Downtime Deployments", desc: "Roll out massive breaking changes without updating legacy clients immediately.", icon: <GlobeLock className="text-neon-blue" /> },
    { title: "Schema Evolution History", desc: "ORCA tracks how your API evolves over time and provides bidirectional patching.", icon: <Layers className="text-neon-purple" /> },
    { title: "Edge Performance", desc: "Healing decisions are cached globally at edge nodes, ensuring <5ms overhead.", icon: <Server className="text-neon-blue" /> },
    { title: "Audit & Observability", desc: "Detailed dashboards showing exactly what was patched, why, and when.", icon: <DatabaseBackup className="text-neon-purple" /> }
  ];

  return (
    <section className="py-32 relative z-10" id="features">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-4xl font-bold tracking-tight text-white">Infrastructure that thinks.</h2>
          <p className="text-lg text-slate-400">
            ORCA doesn't just pass packets. It acts as an intelligent middleware layer. It understands semantic versioning, nested JSON structures, and gRPC definitions seamlessly.
          </p>
          <div className="pt-4">
             <button className="text-neon-blue font-semibold flex items-center gap-2 hover:gap-4 transition-all group">
              Explore full features <ArrowRight className="w-4 h-4 transition-transform" />
             </button>
          </div>
        </div>

        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-2xl glass-card transition-colors hover:bg-white/5"
            >
              <div className="mb-4">{f.icon}</div>
              <h4 className="text-lg font-bold text-white mb-2">{f.title}</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA({ onOpenDashboard, onOpenSignup }) {
  return (
    <section className="py-32 relative z-10 overflow-hidden">
      <div className="absolute inset-0 bg-neon-blue/5" />
      <div className="absolute bottom-0 left-[50%] -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-neon-blue/10 to-transparent" />
      
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.img 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          src="/orca_minimal.png" 
          alt="ORCA Mark" 
          className="h-20 max-w-[80px] mx-auto mb-8 drop-shadow-[0_0_20px_rgba(0,246,255,0.4)]"
        />
        <h2 className="text-5xl font-extrabold tracking-tight text-white mb-6">
          Ready to stop debugging APIs?
        </h2>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Join cutting-edge engineering teams that use ORCA to maintain 99.999% uptime during complex migrations.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={onOpenSignup} className="h-14 px-8 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(176,38,255,0.4)] transition-shadow">
            Create your ORCA account
          </button>
          <button onClick={() => window.location.href='mailto:sales@orca.dev'} className="h-14 px-8 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors">
            Contact Sales
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-navy-900/50 pt-16 pb-8 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/orca_icon.png" alt="ORCA" className="h-6" />
              <span className="font-bold text-white tracking-tight">ORCA</span>
            </div>
            <p className="text-sm text-slate-500">The self-healing gateway for the AI era.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-neon-blue">Gateway</a></li>
              <li><a href="#" className="hover:text-neon-blue">Observability</a></li>
              <li><a href="#" className="hover:text-neon-blue">AI Engine</a></li>
              <li><a href="#" className="hover:text-neon-blue">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-neon-blue">Documentation</a></li>
              <li><a href="#" className="hover:text-neon-blue">API Reference</a></li>
              <li><a href="#" className="hover:text-neon-blue">Blog</a></li>
              <li><a href="#" className="hover:text-neon-blue">Community</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-neon-blue">About</a></li>
              <li><a href="#" className="hover:text-neon-blue">Careers</a></li>
              <li><a href="#" className="hover:text-neon-blue">Legal</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">© 2026 ORCA Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <Activity className="w-4 h-4 cursor-pointer hover:text-white" />
            <Database className="w-4 h-4 cursor-pointer hover:text-white" />
            <ShieldCheck className="w-4 h-4 cursor-pointer hover:text-white" />
          </div>
        </div>
      </div>
    </footer>
  );
}

import ApiDashboard from './ApiDashboard';
import AuthView from './AuthView';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [authMode, setAuthMode] = useState('login');

  const openDashboard = () => {
    if (localStorage.getItem('orca_token')) setCurrentView('dashboard');
    else { setAuthMode('login'); setCurrentView('auth'); }
  };
  const openSignup = () => { setAuthMode('signup'); setCurrentView('auth'); };
  const signOut = () => {
    localStorage.removeItem('orca_token');
    setAuthMode('login');
    setCurrentView('auth');
  };

  if (currentView === 'auth') {
    return <AuthView initialMode={authMode} onBack={() => setCurrentView('landing')} onAuthenticated={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'dashboard') {
    return <ApiDashboard onExit={() => setCurrentView('landing')} onSignOut={signOut} />;
  }

  return (
    <div className="min-h-screen bg-navy-900 selection:bg-neon-purple/30 selection:text-white">
      <FloatingHeartsBackground />
      <Navbar onOpenDashboard={openDashboard} onOpenSignup={openSignup} />
      <main>
        <Hero onOpenDashboard={openDashboard} onOpenSignup={openSignup} />
        <ProblemSolution />
        <HowItWorks />
        <Features />
        <CTA onOpenDashboard={openDashboard} onOpenSignup={openSignup} />
      </main>
      <Footer />
    </div>
  );
}
