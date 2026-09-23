import { useState, useMemo } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { ALL_STANDS, getStandsByTown, getTownsByTaluk, getTaluksByDistrict } from "@/data/index";
import type { Stand } from "@/data/kasaragod";

interface StandsListProps {
  onSelect: (stand: Stand) => void;
  onClose: () => void;
  title?: string;
}

export default function StandsList({ onSelect, onClose, title = "Select Stand" }: StandsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string | "all">("all");
  const [selectedTaluk, setSelectedTaluk] = useState<string | "all">("all");
  const [selectedTown, setSelectedTown] = useState<string | "all">("all");

  const districts = useMemo(() => {
    return [...new Set(ALL_STANDS.map(s => s.district))].sort();
  }, []);

  const taluks = useMemo(() => {
    if (selectedDistrict === "all") {
      return [...new Set(ALL_STANDS.map(s => s.taluk))].sort();
    }
    return getTaluksByDistrict(selectedDistrict);
  }, [selectedDistrict]);

  const towns = useMemo(() => {
    if (selectedDistrict === "all" && selectedTaluk === "all") {
      return [...new Set(ALL_STANDS.map(s => s.town))].sort();
    }
    if (selectedTaluk !== "all") {
      return getTownsByTaluk(selectedTaluk);
    }
    return [...new Set(
      ALL_STANDS.filter(s => s.district === selectedDistrict).map(s => s.town)
    )].sort();
  }, [selectedDistrict, selectedTaluk]);

  const filteredStands = useMemo(() => {
    let stands = ALL_STANDS;

    if (selectedDistrict !== "all") {
      stands = stands.filter(s => s.district === selectedDistrict);
    }
    if (selectedTaluk !== "all") {
      stands = stands.filter(s => s.taluk === selectedTaluk);
    }
    if (selectedTown !== "all") {
      stands = stands.filter(s => s.town === selectedTown);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      stands = stands.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.town.toLowerCase().includes(query)
      );
    }

    return stands;
  }, [selectedDistrict, selectedTaluk, selectedTown, searchQuery]);

  const handleSelect = (stand: Stand) => {
    onSelect(stand);
    onClose();
  };

  return (
    <div 
      className="stands-list-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="stands-list-dialog">
        {/* Header */}
        <div className="stands-list-header">
          <h2 className="font-heading text-lg font-bold">{title}</h2>
          <button 
            className="live-link" 
            onClick={onClose}
            aria-label="Close stands list"
          >
            Cancel
          </button>
        </div>

        {/* Search & Filters */}
        <div className="stands-filters">
          <div className="search-field">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by stand name or town..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
              autoFocus
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery("")} 
                className="clear-search-btn"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-chips">
            <select
              value={selectedDistrict}
              onChange={(e) => { setSelectedDistrict(e.target.value); setSelectedTaluk("all"); setSelectedTown("all"); }}
              className="filter-select"
            >
              <option value="all">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={selectedTaluk}
              onChange={(e) => { setSelectedTaluk(e.target.value); setSelectedTown("all"); }}
              className="filter-select"
            >
              <option value="all">All Taluks</option>
              {taluks.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              value={selectedTown}
              onChange={(e) => setSelectedTown(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Towns</option>
              {towns.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="stands-results">
          {filteredStands.length === 0 ? (
            <div className="empty-state">
              <MapPin size={32} className="text-muted-foreground" />
              <p className="font-body text-muted-foreground">No stands found</p>
              <p className="font-body text-xs text-muted-foreground">Try adjusting your filters or search</p>
            </div>
          ) : (
            <ul className="stands-list">
              {filteredStands.map((stand) => (
                <li key={stand.id} className="stand-item">
                  <button
                    className="stand-button"
                    onClick={() => handleSelect(stand)}
                    type="button"
                  >
                    <div className="stand-info">
                      <span className="stand-name">{stand.name}</span>
                      <span className="stand-location">
                        <MapPin size={12} /> {stand.town}, {stand.district}
                      </span>
                      <span className="stand-meta">{stand.taluk} Taluk</span>
                    </div>
                    <MapPin size={20} className="stand-icon text-primary" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="stands-footer">
          <p className="font-body text-xs text-muted-foreground">
            {filteredStands.length} stand{filteredStands.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>
    </div>
  );
}