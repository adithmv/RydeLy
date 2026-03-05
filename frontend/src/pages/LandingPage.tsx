import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, Lock, CheckCircle, Phone, MapPin, LogIn, ClipboardList, KeyRound, TriangleAlert, Megaphone } from 'lucide-react';
import { getAnnouncements } from '@/lib/api';

function PhoneMockup() {
  return (
    <div className="relative w-[280px] h-[560px] bg-card rounded-[36px] border-4 border-foreground/10 shadow-phone overflow-hidden mx-auto">
      <div className="h-8 bg-foreground/5 flex items-center justify-center">
        <div className="w-20 h-1 bg-foreground/20 rounded-full" />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-primary rounded-md" />
          <span><img src="/src/assets/logo.png" alt="RydeLy" className="h-9 w-9 object-contain" /></span>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-cream-dark px-2 py-1 rounded-pill font-body flex items-center gap-1">
            <MapPin size={8} /> Payyanur
          </span>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-pill font-body">Railway Station</span>
        </div>
        {[
          { name: 'Rajan K', gradient: 'bg-gradient-to-br from-orange to-yellow' },
          { name: 'Manoj P', gradient: 'bg-gradient-to-br from-green to-emerald-400' },
          { name: 'Suresh V', gradient: 'bg-gradient-to-br from-blue-500 to-cyan-400' },
        ].map((d) => (
          <div key={d.name} className="flex items-center gap-3 bg-cream-dark rounded-xl p-3">
            <div className={`w-9 h-9 rounded-full ${d.gradient} flex items-center justify-center text-white text-xs font-heading font-bold`}>
              {d.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-heading text-xs font-bold">{d.name}</p>
              <span className="text-[9px] bg-green-light text-green-dark px-1.5 py-0.5 rounded-pill font-body">✓ Verified</span>
            </div>
            <button className="bg-primary text-white text-[10px] px-3 py-1.5 rounded-pill font-body font-medium flex items-center gap-1">
              <Phone size={8} /> Call
            </button>
          </div>
        ))}
        <p className="text-[9px] text-muted-foreground text-center font-body mt-2 flex items-center justify-center gap-1">
          <Lock size={8} /> Call logged for your safety
        </p>
      </div>
    </div>
  );
}

function MarqueeStrip() {
  const items = ['Verified Drivers', 'Stand-Based Directory', 'Direct GSM Calls', 'OTP Authentication', 'Safety Logged', 'Multi-Town Support', 'No App for Drivers', 'Admin Verified'];
  const doubled = [...items, ...items];
  return (
    <div className="border-y border-border-warm bg-card py-4 overflow-hidden">
      <div className="animate-marquee flex whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-4 mx-6 font-heading text-sm font-semibold text-foreground/70">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { num: '01', icon: <LogIn size={28} className="text-primary" />, title: 'Login with OTP', malayalam: 'OTP ലോഗിൻ', desc: 'Enter your phone number and verify with a one-time password. Quick and secure.' },
    { num: '02', icon: <MapPin size={28} className="text-primary" />, title: 'Pick Your Stand', malayalam: 'സ്റ്റാൻഡ് തിരഞ്ഞെടുക്കുക', desc: 'Select your town and auto stand to find nearby verified drivers.' },
    { num: '03', icon: <Phone size={28} className="text-primary" />, title: 'Call Directly', malayalam: 'നേരിട്ട് വിളിക്കുക', desc: 'Call any verified driver with one tap. The call is logged for your safety.' },
  ];
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-background">
      <div className="max-w-[1100px] mx-auto px-5">
        <div className="text-center mb-12">
          <span className="text-primary font-body text-sm font-semibold uppercase tracking-wider">How it works</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mt-2">Three simple steps</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-card rounded-card p-7 shadow-card border border-border-warm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-yellow" />
              <span className="font-heading text-5xl font-bold text-foreground/5">{step.num}</span>
              <div className="mt-2 mb-3">{step.icon}</div>
              <h3 className="font-heading text-lg font-bold">{step.title}</h3>
              <p className="font-malayalam text-xs text-muted-foreground mt-1">{step.malayalam}</p>
              <p className="font-body text-sm text-muted-foreground mt-3">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SafetySection() {
  const cards = [
    { icon: <ShieldCheck size={28} className="text-yellow" />, title: 'Admin-Verified Drivers', desc: 'Every driver is manually verified before appearing in the directory.' },
    { icon: <ClipboardList size={28} className="text-yellow" />, title: 'Every Call is Logged', desc: 'All calls are recorded with timestamps for your safety and accountability.' },
    { icon: <KeyRound size={28} className="text-yellow" />, title: 'OTP Authentication', desc: 'Phone-based OTP login ensures only real users access the platform.' },
    { icon: <TriangleAlert size={28} className="text-yellow" />, title: 'Report System', desc: 'Report any driver after a call. Three strikes and the driver is banned.' },
  ];
  return (
    <section id="safety" className="py-16 md:py-24 bg-foreground text-primary-foreground">
      <div className="max-w-[1100px] mx-auto px-5">
        <div className="text-center mb-12">
          <span className="text-yellow font-body text-sm font-semibold uppercase tracking-wider">Safety First</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mt-2 text-primary-foreground">Your safety, our priority</h2>
          <p className="font-malayalam text-sm text-primary-foreground/60 mt-2">നിങ്ങളുടെ സുരക്ഷ, ഞങ്ങളുടെ മുൻഗണന</p>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-card p-7 flex-shrink-0 w-[280px] md:w-[calc(25%-15px)] snap-start"
            >
              <div className="mb-4">{card.icon}</div>
              <h3 className="font-heading text-lg font-bold text-primary-foreground">{card.title}</h3>
              <p className="font-body text-sm text-primary-foreground/60 mt-2">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForDriversSection() {
  const navigate = useNavigate();
  const stats = [
    { icon: <Shield size={20} className="text-primary" />, value: 'Zero internet needed', malayalam: 'ഇന്റർനെറ്റ് ആവശ്യമില്ല' },
    { icon: <CheckCircle size={20} className="text-primary" />, value: '₹0 Commission', malayalam: 'കമ്മീഷൻ ഇല്ല' },
    { icon: <Phone size={20} className="text-primary" />, value: 'Any phone works', malayalam: 'ഏതു ഫോണും മതി' },
  ];
  const perks = [
    'Get listed in the local directory for free',
    'Receive direct calls from verified commuters',
    'No smartphone or internet connection required',
    'Build trust through the admin verification system',
  ];
  return (
    <section id="for-drivers" className="py-16 md:py-24 bg-background">
      <div className="max-w-[1100px] mx-auto px-5 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          {stats.map((s) => (
            <div key={s.value} className="bg-card rounded-card p-5 shadow-card border border-border-warm flex items-start gap-4">
              <div className="mt-1">{s.icon}</div>
              <div>
                <p className="font-heading text-lg font-bold">{s.value}</p>
                <p className="font-malayalam text-xs text-muted-foreground mt-1">{s.malayalam}</p>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold leading-tight">No app. No commission.<br />Just calls.</h2>
          <ul className="mt-6 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3 font-body text-sm text-muted-foreground">
                <CheckCircle size={16} className="text-green mt-0.5 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/register')}
            className="btn-pill bg-primary hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all shadow-orange-glow mt-8"
          >
            Register as Driver
          </button>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const navigate = useNavigate();
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.15),transparent_70%)]" />
      <div className="relative max-w-[1100px] mx-auto px-5 text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold">Ready to find your auto?</h2>
        <p className="font-malayalam text-sm text-muted-foreground mt-2">നിങ്ങളുടെ ഓട്ടോ കണ്ടെത്താൻ തയ്യാറാണോ?</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button onClick={() => navigate('/login')} className="btn-pill bg-primary text-primary-foreground hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all shadow-orange-glow font-medium">
            Find Drivers
          </button>
          <button onClick={() => navigate('/register')} className="btn-pill bg-primary text-primary-foreground hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all shadow-orange-glow font-medium">
            Register as Driver
          </button>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    getAnnouncements()
      .then((data: { message: string }[]) => {
        setAnnouncements(data.map((a) => a.message));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrollY = window.scrollY;
      heroRef.current.querySelectorAll<HTMLElement>('.parallax-blob').forEach(el => el.style.transform = `translateY(${scrollY * 0.07}px)`);
      heroRef.current.querySelectorAll<HTMLElement>('.parallax-ring').forEach(el => el.style.transform = `translateY(${scrollY * 0.2}px)`);
      heroRef.current.querySelectorAll<HTMLElement>('.parallax-dot').forEach(el => el.style.transform = `translateY(${scrollY * 0.4}px)`);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main>

      {/* Announcements Banner */}
      {announcements.length > 0 && (
        <div className="bg-primary text-primary-foreground py-2 px-4 overflow-hidden mt-[60px] md:mt-[72px]">
          <div className="flex items-center gap-3 max-w-[1100px] mx-auto">
            <span className="shrink-0 flex items-center gap-1.5 bg-primary-foreground/20 px-2.5 py-1 rounded-full font-body text-xs font-semibold">
              <Megaphone size={11} /> Notice
            </span>
            <div className="overflow-hidden flex-1">
              <div className="flex animate-marquee whitespace-nowrap">
  {[...Array(6)].map((_, i) => (
    <span key={i} className="font-body text-xs mx-8 shrink-0">
      {announcements.join('   •   ')}
    </span>
  ))}
</div>
            </div>
          </div>
        </div>
      )}

      <section
        ref={heroRef}
        className={`relative min-h-[calc(100vh-72px)] flex items-center overflow-hidden ${announcements.length > 0 ? '' : 'mt-[60px] md:mt-[72px]'}`}
      >
        <div className="parallax-blob absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="parallax-blob absolute bottom-20 right-20 w-96 h-96 bg-yellow/10 rounded-full blur-3xl" />
        <div className="parallax-ring absolute top-32 right-40 w-40 h-40 border-2 border-primary/10 rounded-full" />
        <div className="parallax-ring absolute bottom-40 left-32 w-24 h-24 border-2 border-yellow/15 rounded-full" />
        <div className="parallax-dot absolute top-48 left-[60%] w-3 h-3 bg-primary/30 rounded-full" />
        <div className="parallax-dot absolute top-72 left-[20%] w-2 h-2 bg-yellow/40 rounded-full" />
        <div className="parallax-dot absolute bottom-32 right-[30%] w-4 h-4 bg-primary/20 rounded-full" />

        <div className="relative max-w-[1100px] mx-auto px-5 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block bg-primary/10 text-primary font-body text-sm font-semibold px-4 py-1.5 rounded-pill mb-6"
            >
              Kerala's Local Auto Directory
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight"
            >
              Your Auto,<br />One Tap Away
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-malayalam text-sm text-muted-foreground mt-2"
            >
              നിങ്ങളുടെ ഓട്ടോ, ഒരു ടാപ്പിൽ
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-body text-base text-muted-foreground mt-4 max-w-md"
            >
              Browse verified local auto-rickshaw drivers by stand. Call directly — no app needed for drivers. Safe, simple, and built for Kerala.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-4 mt-8"
            >
              <button onClick={() => navigate('/login')} className="btn-pill bg-primary text-primary-foreground hover:bg-[hsl(var(--orange))] hover:text-foreground transition-all shadow-orange-glow font-medium">
                Find Drivers
              </button>
              <a href="#how-it-works" className="btn-pill bg-transparent text-foreground border-2 border-foreground hover:bg-foreground/5 transition-all font-medium">
                How it works
              </a>
            </motion.div>
          </div>

          <div className="relative hidden md:block">
            <div className="animate-float absolute -top-4 -left-4 bg-card rounded-pill px-4 py-2 shadow-card-hover border border-border-warm z-10 flex items-center gap-2">
              <CheckCircle size={12} className="text-green" />
              <span className="font-body text-xs font-medium">Verified Driver</span>
            </div>
            <div className="animate-float-delay-1 absolute top-32 -right-8 bg-card rounded-pill px-4 py-2 shadow-card-hover border border-border-warm z-10 flex items-center gap-2">
              <Lock size={12} className="text-primary" />
              <span className="font-body text-xs font-medium">Safety Logged</span>
            </div>
            <div className="animate-float-delay-2 absolute bottom-12 -left-6 bg-card rounded-pill px-4 py-2 shadow-card-hover border border-border-warm z-10 flex items-center gap-2">
              <Phone size={12} className="text-primary" />
              <span className="font-body text-xs font-medium">Direct GSM Call</span>
            </div>
            <PhoneMockup />
          </div>
        </div>
      </section>

      <MarqueeStrip />
      <HowItWorks />
      <SafetySection />
      <ForDriversSection />
      <CTASection />
    </main>
  );
}