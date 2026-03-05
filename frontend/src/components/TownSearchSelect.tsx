import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, X } from "lucide-react";

interface Props {
  towns: string[];
  value: string;
  onChange: (town: string) => void;
  placeholder?: string;
}

export default function TownSearchSelect({ towns, value, onChange, placeholder = "Search town..." }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = towns.filter(t =>
    t.toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSelect = (town: string) => {
    onChange(town);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 pl-10 pr-10 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors text-left"
      >
        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || placeholder}
        </span>
      </button>

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>
      )}

      <ChevronDown
        size={16}
        className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-transform ${open ? "rotate-180" : ""}`}
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-cream-dark border border-border-warm rounded-xl shadow-modal overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border-warm">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="w-full px-3 py-2 bg-card rounded-lg font-body text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Results */}
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 font-body text-sm text-muted-foreground text-center">
                No towns found
              </li>
            ) : (
              filtered.map(town => (
                <li key={town}>
                  <button
                    type="button"
                    onClick={() => handleSelect(town)}
                    className={`w-full text-left px-4 py-2.5 font-body text-sm transition-colors hover:bg-card ${
                        value === town ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                    }`}
                  >
                    {town}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}