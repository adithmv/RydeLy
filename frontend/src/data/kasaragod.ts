// ============================================================
// RydeLy — Kasaragod District Location Data
// Source: towns.txt (Kasaragod district localities and stands)
// Taluks: Manjeshwaram, Kasaragod, Hosdurg, Vellarikundu
// ============================================================

export interface Stand {
  id: string;
  name: string;
  town: string;
  taluk: string;
  district: string;
}

export const KASARAGOD_STANDS: Stand[] = [

  // ══════════════════════════════════════════════════════════
  // KASARAGOD TALUK
  // ══════════════════════════════════════════════════════════

  { id: "ksd-mini",              name: "Mini Auto Stand",                      town: "Kasaragod Town",     taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-taluk-office",      name: "Taluk Office Taxi Stand",              town: "Kasaragod Town",     taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-panduranga",        name: "Panduranga Auto Stand",                town: "Mallikarjuna Temple",taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-mallikarjuna",      name: "Mallikarjuna Taxi Stand",              town: "Kasaragod Town",     taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-railway-road",      name: "Railway Station Road Mini Auto Stand", town: "Thayalangadi",       taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-railway",           name: "Kasaragod Railway Station Auto Stand", town: "Kasaragod Town",     taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-mulleria",          name: "Mulleria Auto Stand",                  town: "Mulleria",           taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-vidyanagar",        name: "Vidyanagar Auto Stand",                town: "Vidyanagar",         taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-kuntar",            name: "Kuntar Auto Rickshaw Stand",           town: "Kuntar",             taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-bovikanam",         name: "Bovikanam Auto Stand",                 town: "Bovikanam",          taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-naimarmoola",       name: "Naimarmoola Auto Stand",               town: "Naimarmoola",        taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-nullipady",         name: "Nullipady Auto Stand",                 town: "Nullipady",          taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-karandakkad",       name: "Karandakkad Auto Stand",               town: "Karandakkad",        taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-adhur",             name: "Adhur Auto Stand",                     town: "Adhur",              taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-badiyadka",         name: "Badiyadka Auto Stand",                 town: "Badiyadka",          taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-kalnad",            name: "Kalnad Auto Stand",                    town: "Kalnad",             taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-nirchal",           name: "Nirchal Auto Stand",                   town: "Nirchal",            taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-perumbala",         name: "Perumbala Auto Stand",                 town: "Perumbala",          taluk: "Kasaragod",    district: "Kasaragod" },
  { id: "ksd-thekkil",           name: "Thekkil Auto Stand",                   town: "Thekkil",            taluk: "Kasaragod",    district: "Kasaragod" },

  // ══════════════════════════════════════════════════════════
  // HOSDURG TALUK
  // ══════════════════════════════════════════════════════════

  { id: "hsd-alamippally",       name: "Alamippally New Bus Stand Auto Stand", town: "Kanhangad",          taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-bus-terminal",      name: "Kanhangad Bus Terminal Auto Stand",    town: "Kanhangad",          taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-tb-road",           name: "T.B. Road Auto Stand",                 town: "Kanhangad",          taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-nileshwar-railway", name: "Nileshwar Railway Station Auto Stand", town: "Nileshwar",          taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-nileshwar-market",  name: "Market Junction Auto Stand",           town: "Nileshwar",          taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-cheruvathur",       name: "Cheruvathur Stand",                    town: "Cheruvathur",        taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-trikaripur",        name: "Trikaripur Railway Stand",             town: "Trikaripur",         taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-bheemanady",        name: "Bheemanady Auto Stand",                town: "Bheemanady",         taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-cheemeni",          name: "Cheemeni Auto Stand",                  town: "Cheemeni",           taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-perumbatta",        name: "Perumbatta Auto Stand",                town: "Perumbatta",         taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-mavungal",          name: "Mavungal Junction Auto Stand",         town: "Mavungal",           taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-uduma",             name: "Uduma Auto Stand",                     town: "Uduma",              taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-pullur",            name: "Pullur Auto Stand",                    town: "Pullur",             taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-ajanur",            name: "Ajanur Auto Stand",                    town: "Ajanur",             taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-bare",              name: "Bare Auto Stand",                      town: "Bare",               taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-maniyat",           name: "Maniyat Auto Stand",                   town: "Maniyat",            taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-pilicode",          name: "Pilicode Auto Stand",                  town: "Pilicode",           taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-balla",             name: "Balla Auto Stand",                     town: "Balla",              taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-thuruthi",          name: "Thuruthi Auto Stand",                  town: "Thuruthi",           taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-pudukai",           name: "Pudukai Auto Stand",                   town: "Pudukai",            taluk: "Hosdurg",      district: "Kasaragod" },
  { id: "hsd-valiyaparamba",     name: "Valiyaparamba Auto Stand",             town: "Valiyaparamba",      taluk: "Hosdurg",      district: "Kasaragod" },

  // ══════════════════════════════════════════════════════════
  // MANJESHWARAM TALUK
  // ══════════════════════════════════════════════════════════

  { id: "mnj-kumbla",            name: "Kumbla Station Road Auto Stand",       town: "Kumbla",             taluk: "Manjeshwaram", district: "Kasaragod" },
  { id: "mnj-uppala",            name: "Uppala Gate Auto Stand",               town: "Uppala",             taluk: "Manjeshwaram", district: "Kasaragod" },
  { id: "mnj-bandiyod",          name: "Bandiyod Auto Stand",                  town: "Mangalpady",         taluk: "Manjeshwaram", district: "Kasaragod" },
  { id: "mnj-vorkady",           name: "Vorkady Auto Stand",                   town: "Vorkady",            taluk: "Manjeshwaram", district: "Kasaragod" },
  { id: "mnj-enmakaje",          name: "Enmakaje Auto Stand",                  town: "Enmakaje",           taluk: "Manjeshwaram", district: "Kasaragod" },
  { id: "mnj-puthige",           name: "Puthige Auto Stand",                   town: "Puthige",            taluk: "Manjeshwaram", district: "Kasaragod" },
  { id: "mnj-mogral",            name: "Mogral Auto Stand",                    town: "Mogral",             taluk: "Manjeshwaram", district: "Kasaragod" },
  { id: "mnj-bekoor",            name: "Bekoor Auto Stand",                    town: "Bekoor",             taluk: "Manjeshwaram", district: "Kasaragod" },
  { id: "mnj-shiriya",           name: "Shiriya Auto Stand",                   town: "Shiriya",            taluk: "Manjeshwaram", district: "Kasaragod" },
  { id: "mnj-kubanoor",          name: "Kubanoor Auto Stand",                  town: "Kubanoor",           taluk: "Manjeshwaram", district: "Kasaragod" },

  // ══════════════════════════════════════════════════════════
  // VELLARIKUNDU TALUK
  // ══════════════════════════════════════════════════════════

  { id: "vlk-busstand",          name: "Vellarikundu Bus Stand Auto Stand",    town: "Vellarikundu",       taluk: "Vellarikundu", district: "Kasaragod" },
  { id: "vlk-ennappara",         name: "Ennappara Auto Stand",                 town: "Ennappara",          taluk: "Vellarikundu", district: "Kasaragod" },
  { id: "vlk-naikayam",          name: "Naikayam Auto Stand",                  town: "Naikayam",           taluk: "Vellarikundu", district: "Kasaragod" },
  { id: "vlk-panathady",         name: "Panathady Auto Stand",                 town: "Panathady",          taluk: "Vellarikundu", district: "Kasaragod" },
  { id: "vlk-rajapuram",         name: "Rajapuram Auto Stand",                 town: "Rajapuram",          taluk: "Vellarikundu", district: "Kasaragod" },
  { id: "vlk-chittarikkal",      name: "Chittarikkal Auto Stand",              town: "Chittarikkal",       taluk: "Vellarikundu", district: "Kasaragod" },
  { id: "vlk-kinanoor",          name: "Kinanoor Auto Stand",                  town: "Kinanoor",           taluk: "Vellarikundu", district: "Kasaragod" },
  { id: "vlk-thayannur",         name: "Thayannur Auto Stand",                 town: "Thayannur",          taluk: "Vellarikundu", district: "Kasaragod" },
  { id: "vlk-kallar",            name: "Kallar Auto Stand",                    town: "Kallar",             taluk: "Vellarikundu", district: "Kasaragod" },
];

// ── Helper: all unique towns in Kasaragod ─────────────────────
export const KASARAGOD_TOWNS = [...new Set(KASARAGOD_STANDS.map(s => s.town))].sort();

// ── Helper: get stands by town name ──────────────────────────
export function getKasaragodStandsByTown(town: string): Stand[] {
  return KASARAGOD_STANDS.filter(s => s.town === town);
}

// ── Helper: all unique taluks ─────────────────────────────────
export const KASARAGOD_TALUKS = [...new Set(KASARAGOD_STANDS.map(s => s.taluk))].sort();

// ── Helper: get towns by taluk ────────────────────────────────
export function getKasaragodTownsByTaluk(taluk: string): string[] {
  return [...new Set(
    KASARAGOD_STANDS.filter(s => s.taluk === taluk).map(s => s.town)
  )].sort();
}