import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerDriver } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ChevronDown, Loader2, Car } from "lucide-react";

const BASE = "http://127.0.0.1:5000";

interface Stand {
  id: string;
  name: string;
  town: string;
}

export default function DriverRegistrationPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [town, setTown] = useState("");
  const [standId, setStandId] = useState("");

  const [towns, setTowns] = useState<string[]>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [loadingStands] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Fetch towns on mount ──────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/commuter/stands`, { credentials: "include" })
      .then(r => r.json())
      .then((data: Stand[]) => {
        const uniqueTowns = [...new Set(data.map(s => s.town))].sort();
        setTowns(uniqueTowns);
        setStands(data);
      })
      .catch(() => {
        // fallback — leave towns empty, show error on submit
      });
  }, []);

  // ── Filter stands when town changes ──────────────────────
  const filteredStands = stands.filter(s => s.town === town);

  useEffect(() => {
    setStandId("");
  }, [town]);

  const canSubmit = name.trim().length >= 2 && phone.length === 10 && town && standId && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await registerDriver({ name: name.trim(), phone, town, standId });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex">

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-foreground text-primary-foreground p-12">
        <div>
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-8">
            <Car size={24} className="text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold leading-tight">
            Join RydeLy as a Driver
          </h1>
          <p className="font-malayalam text-base text-primary-foreground/70 mt-2">
            ഡ്രൈവറായി ചേരൂ
          </p>
          <p className="font-body text-sm text-primary-foreground/60 mt-5 leading-relaxed">
            Register your auto-rickshaw and start receiving direct calls from commuters in your area. Zero commission, always.
          </p>
        </div>
        <div className="space-y-4">
          {["Zero commission on every ride", "Direct calls from commuters", "You control your availability"].map(item => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle size={16} className="text-primary flex-shrink-0" />
              <span className="font-body text-sm text-primary-foreground/80">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[440px]">

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 py-8"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold">Registration Submitted!</h2>
                  <p className="font-malayalam text-sm text-muted-foreground mt-1">
                    രജിസ്ട്രേഷൻ സ്വീകരിച്ചു
                  </p>
                </div>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  Our team will review your application and verify your details. You'll receive a call once approved — usually within 24 hours.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="btn-pill bg-primary text-primary-foreground font-medium shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all"
                >
                  Back to Home
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="font-heading text-2xl font-bold">Driver Registration</h2>
                  <p className="font-body text-sm text-muted-foreground mt-1">Fill in your details to get started</p>
                  <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
                    നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Name */}
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name as on licence"
                      className="w-full px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                    />
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
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
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
                      <select
                        value={town}
                        onChange={e => setTown(e.target.value)}
                        className="w-full appearance-none px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors pr-10"
                      >
                        <option value="">Select your town</option>
                        {towns.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Stand */}
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-2">
                      Auto Stand
                    </label>
                    <div className="relative">
                      <select
                        value={standId}
                        onChange={e => setStandId(e.target.value)}
                        disabled={!town || loadingStands}
                        className="w-full appearance-none px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {!town ? "Select a town first" : filteredStands.length === 0 ? "No stands found" : "Select your stand"}
                        </option>
                        {filteredStands.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="font-body text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      {error}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full btn-pill bg-primary text-primary-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : "Submit Registration"}
                  </button>

                  <p className="font-body text-[11px] text-muted-foreground text-center">
                    Already registered?{" "}
                    <button type="button" onClick={() => navigate("/login")} className="text-primary hover:underline">
                      Sign in here
                    </button>
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}