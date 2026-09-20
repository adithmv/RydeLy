import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { searchPlaces, type Place } from "@/lib/live";
export default function PlaceSearch({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: Place;
  onChange: (place: Place | undefined) => void;
}) {
  const [query, setQuery] = useState(""),
    [results, setResults] = useState<Place[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const sequence = useRef(0);
  const search = async () => {
    const seq = ++sequence.current;
    setBusy(true);
    setError("");
    try {
      const found = await searchPlaces(query);
      if (seq === sequence.current) {
        setResults(found);
        if (!found.length)
          setError(
            "No matching places. Try a fuller address or choose on the map.",
          );
      }
    } catch (e) {
      if (seq === sequence.current)
        setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      if (seq === sequence.current) setBusy(false);
    }
  };
  return (
    <div className="place-search">
      <label>
        {label}
        <div className="search-field">
          <input
            aria-label={label}
            value={value?.label ?? query}
            placeholder={`Search ${label.toLowerCase()}`}
            onChange={(e) => {
              sequence.current++;
              setBusy(false);
              onChange(undefined);
              setQuery(e.target.value);
              setResults([]);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (query.trim().length >= 3) void search();
              }
            }}
          />
          <button
            type="button"
            aria-label={`Search ${label.toLowerCase()}`}
            disabled={busy || !!value || query.trim().length < 3}
            onClick={() => void search()}
          >
            <Search size={17} />
          </button>
        </div>
      </label>
      {busy && <small role="status">Searching addresses…</small>}
      {results.length > 0 && (
        <ul className="place-results">
          {results.map((p, i) => (
            <li key={i}>
              <button
                onClick={() => {
                  sequence.current++;
                  onChange(p);
                  setResults([]);
                  setQuery(p.label);
                }}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="live-error">
          {error}
        </p>
      )}
      {value && (
        <small className="live-muted">
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </small>
      )}
    </div>
  );
}
