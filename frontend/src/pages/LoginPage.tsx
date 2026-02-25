import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ShieldCheck, ArrowLeft, Lock, MapPin, Star } from 'lucide-react';

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { login, loginAsAdmin } = useApp();

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) setStep(2);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };
const handleVerify = (e: React.FormEvent) => {
  e.preventDefault();
  if (otp.every(d => d !== '')) {
    if (phone.endsWith('0000')) {
      loginAsAdmin();
      navigate('/admin');
    } else if (phone.endsWith('1111')) {
      login(true);
      navigate('/driver/portal');
    } else {
      login(false);
      navigate('/home');
    }
  }
};
  const isOtpComplete = otp.every(d => d !== '');
  const maskedPhone = phone ? `+91 ${phone.slice(0, 2)}****${phone.slice(-2)}` : '';

  return (
    <main className="min-h-screen flex">

      {/* LEFT — Branding panel */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-foreground text-primary-foreground px-14 py-16">
        
        {/* Logo */}
        <div>
          <img src="/src/assets/logo.png" alt="RydeLy" className="h-10 object-contain" />
        </div>

        {/* Center copy */}
        <div>
          <h1 className="font-heading text-4xl font-bold leading-tight">
            Kerala's local<br />
            auto directory.<br />
            <span className="text-yellow">Direct calls.</span>
          </h1>
          <p className="font-malayalam text-primary-foreground/60 text-sm mt-4">
            കേരളത്തിലെ ഓട്ടോ ഡ്രൈവർമാരുടെ<br />ഡയറക്ടറി
          </p>

          {/* Trust badges */}
          <div className="flex flex-col gap-4 mt-10">
            {[
              { icon: <ShieldCheck size={18} className="text-yellow" />, text: 'Admin-verified drivers only' },
              { icon: <MapPin size={18} className="text-yellow" />, text: 'Stand-based local filtering' },
              { icon: <Star size={18} className="text-yellow" />, text: 'Every call logged for safety' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                {item.icon}
                <span className="font-body text-sm text-primary-foreground/80">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="font-body text-xs text-primary-foreground/30">
          © 2026 RydeLy. No commission. No app needed.
        </p>
      </div>

      {/* RIGHT — Form panel */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-20">
        <div className="w-full max-w-[400px]">

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSendOtp}
                className="space-y-6"
              >
                {/* Header */}
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
                    <Phone size={22} className="text-primary" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold">Welcome back</h2>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    Enter your phone number to continue
                  </p>
                  <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
                    തുടരാൻ നിങ്ങളുടെ ഫോൺ നമ്പർ നൽകുക
                  </p>
                </div>

                {/* Phone input */}
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
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="flex-1 px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={phone.length < 10}
                  className="w-full btn-pill bg-primary text-primary-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all"
                >
                  Send OTP
                </button>

                <p className="font-body text-[11px] text-muted-foreground text-center">
                  A 6-digit code will be sent to your number via SMS
                </p>
              </motion.form>

            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleVerify}
                className="space-y-6"
              >
                {/* Header */}
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
                    <Lock size={22} className="text-primary" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold">Verify OTP</h2>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    Code sent to <span className="font-medium text-foreground">{maskedPhone}</span>
                  </p>
                  <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
                    OTP കോഡ് നൽകുക
                  </p>
                </div>

                {/* OTP boxes */}
                <div className="flex justify-between gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center font-heading text-xl font-bold bg-cream-dark border-2 border-border-warm rounded-xl focus:border-primary outline-none transition-colors"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!isOtpComplete}
                  className="w-full btn-pill bg-primary text-primary-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all"
                >
                  Verify & Login
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); }}
                  className="w-full flex items-center justify-center gap-2 font-body text-sm text-primary hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={15} />
                  Change number
                </button>
              </motion.form>
            )}
          </AnimatePresence>

        </div>
      </div>
    </main>
  );
}