import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TOWNS, STANDS } from '@/data/mockData';
import { User, Phone, MapPin, Navigation, CheckCircle, ChevronDown } from 'lucide-react';

export default function DriverRegistrationPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', town: '', stand: '' });

  const isValid = form.name && form.phone.length >= 10 && form.town && form.stand;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px] mx-5 bg-card rounded-card p-10 shadow-card border border-border-warm text-center space-y-5"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-light rounded-full mx-auto">
            <CheckCircle size={32} className="text-green-dark" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">Registration Submitted!</h1>
            <p className="font-malayalam text-xs text-muted-foreground mt-1">രജിസ്ട്രേഷൻ സമർപ്പിച്ചു</p>
          </div>
          <p className="font-body text-sm text-muted-foreground">
            Your registration is under admin review. You'll be added to the directory once approved.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full btn-pill bg-primary text-primary-foreground font-medium shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all"
          >
            Back to Home
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex">

      {/* LEFT — Branding panel */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-foreground text-primary-foreground px-14 py-16">
        <div>
          <img src="/src/assets/logo.png" alt="RydeLy" className="h-10 object-contain" />
        </div>

        <div>
          <h1 className="font-heading text-4xl font-bold leading-tight">
            Join Kerala's<br />
            local auto<br />
            <span className="text-yellow">directory.</span>
          </h1>
          <p className="font-malayalam text-primary-foreground/60 text-sm mt-4">
            കേരളത്തിലെ ഓട്ടോ ഡ്രൈവർ<br />ഡയറക്ടറിയിൽ ചേരുക
          </p>

          <div className="flex flex-col gap-4 mt-10">
            {[
              { icon: <CheckCircle size={18} className="text-yellow" />, text: 'Get listed for free — zero commission' },
              { icon: <Phone size={18} className="text-yellow" />, text: 'Receive direct calls, no app needed' },
              { icon: <Navigation size={18} className="text-yellow" />, text: 'Listed under your local auto stand' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                {item.icon}
                <span className="font-body text-sm text-primary-foreground/80">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="font-body text-xs text-primary-foreground/30">
          © 2026 RydeLy. Admin-verified drivers only.
        </p>
      </div>

      {/* RIGHT — Form panel */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[400px]"
          >
            {/* Header */}
            <div className="mb-7">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
                <User size={22} className="text-primary" />
              </div>
              <h2 className="font-heading text-2xl font-bold">Register as Driver</h2>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Fill in your details — admin will verify you
              </p>
              <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
                നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full Name */}
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-2">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <span className="flex items-center justify-center bg-cream-dark border-2 border-border-warm rounded-xl px-4 font-body text-sm text-muted-foreground font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10-digit mobile number"
                    className="flex-1 px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Town */}
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-2">
                  Town
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={form.town}
                    onChange={e => setForm(f => ({ ...f, town: e.target.value, stand: '' }))}
                    className="w-full pl-10 pr-10 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Select Town</option>
                    {TOWNS.map((t: string) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Auto Stand */}
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-2">
                  Auto Stand
                </label>
                <div className="relative">
                  <Navigation size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={form.stand}
                    onChange={e => setForm(f => ({ ...f, stand: e.target.value }))}
                    disabled={!form.town}
                    className="w-full pl-10 pr-10 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Auto Stand</option>
                    {form.town && STANDS[form.town]?.map((s: string) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={!isValid}
                className="w-full btn-pill bg-primary text-primary-foreground font-medium disabled:bg-[hsl(var(--cream-dark))] disabled:text-muted-foreground disabled:shadow-none disabled:cursor-not-allowed shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all"
              >
                Submit Registration
              </button>

              <p className="font-body text-[11px] text-muted-foreground text-center">
                Your registration will be reviewed by our admin team before going live
              </p>

            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}