import { ALL_TOWNS, getStandsByTown } from "@/data/index";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { motion } from "framer-motion";
import {  Navigation, Search, ChevronDown, Clock, ShieldCheck, Phone } from "lucide-react";
import TownSearchSelect from "@/components/TownSearchSelect";


export default function HomePage() {
  const navigate = useNavigate();
  const { selectedTown, selectedStand, setSelectedTown, setSelectedStand } = useApp();



  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetingMalayalam = hour < 12 ? "സുപ്രഭാതം" : hour < 17 ? "ശുഭ ഉച്ചയ്ക്ക്" : "ശുഭ സന്ധ്യ";

  // ── Fetch stands on mount ─────────────────────────────


const towns = ALL_TOWNS;

const filteredStands = getStandsByTown(selectedTown);

  const handleTownChange = (town: string) => {
    setSelectedTown(town);
    setSelectedStand("");
  };

  const handleFind = () => {
    if (selectedTown && selectedStand) {
      const standName = filteredStands.find(s => s.id === selectedStand)?.name || selectedStand;
navigate(`/drivers?town=${encodeURIComponent(selectedTown)}&stand=${encodeURIComponent(selectedStand)}&standName=${encodeURIComponent(standName)}`);
    }
  };

  return (
    <main className="min-h-screen bg-background">

      {/* Hero Banner */}
      <div className="bg-foreground text-primary-foreground pt-28 pb-20 px-5 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-48 h-48 border border-white/5 rounded-full" />
        <div className="absolute top-20 right-20 w-32 h-32 border border-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 border border-white/5 rounded-full" />

        <div className="max-w-[600px] mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-malayalam text-primary-foreground/50 text-sm mb-2">{greetingMalayalam}</p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold leading-tight">
              {greeting},<br />
              find your <span className="text-yellow">auto.</span>
            </h1>
            <p className="font-malayalam text-primary-foreground/60 text-sm mt-3">
              നിങ്ങളുടെ ഓട്ടോ കണ്ടെത്തുക
            </p>
            <div className="flex items-center gap-5 mt-7">
              {[
                { icon: <ShieldCheck size={14} className="text-yellow" />, text: "Verified drivers" },
                { icon: <Phone size={14} className="text-yellow" />, text: "Direct calls" },
                { icon: <Clock size={14} className="text-yellow" />, text: "5 calls/hour" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-1.5">
                  {item.icon}
                  <span className="font-body text-xs text-primary-foreground/70">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search Card */}
      <div className="max-w-[600px] mx-auto px-5 -mt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-card rounded-card p-7 shadow-modal border border-border-warm"
        >
          <h2 className="font-heading text-lg font-bold mb-5">Search by stand</h2>

          <div className="space-y-4">

            {/* Town */}
            <div>
  <label className="font-body text-sm font-medium text-foreground block mb-2">Town</label>
  <TownSearchSelect
    towns={towns}
    value={selectedTown}
    onChange={handleTownChange}
    placeholder="Search town..."
  />
</div>

            {/* Stand */}
            <div>
              <label className="font-body text-sm font-medium text-foreground block mb-2">Auto Stand</label>
              <div className="relative">
                <Navigation size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={selectedStand}
                  onChange={e => setSelectedStand(e.target.value)}
                  disabled={!selectedTown}
                  className="w-full pl-10 pr-10 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!selectedTown ? "Select a town first" : filteredStands.length === 0 ? "No stands found" : "Select Auto Stand"}
                  </option>
                  {filteredStands.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <button
              onClick={handleFind}
              disabled={!selectedTown || !selectedStand}
              className="w-full btn-pill bg-primary text-primary-foreground font-medium disabled:bg-[hsl(var(--cream-dark))] disabled:text-muted-foreground disabled:shadow-none disabled:cursor-not-allowed shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all flex items-center justify-center gap-2"
            >
              <Search size={16} /> Find Drivers
            </button>
          </div>

          <p className="font-body text-[11px] text-muted-foreground text-center mt-5">
            You can call up to 5 drivers per hour for safety
          </p>
        </motion.div>

        {/* Stand shortcut pills */}
        {selectedTown && filteredStands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-5"
          >
            <p className="font-body text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
              Stands in {selectedTown}
            </p>
            <div className="flex flex-wrap gap-2">
              {filteredStands.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStand(s.id)}
                  className={`font-body text-xs px-3 py-1.5 rounded-full border transition-all ${
                    selectedStand === s.id
                      ? "bg-primary text-primary-foreground border-primary shadow-orange-glow"
                      : "bg-card border-border-warm text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}