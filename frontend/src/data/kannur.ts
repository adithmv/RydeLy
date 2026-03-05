// ============================================================
// RydeLy — Kannur District Location Data
// Source: Socio-Spatial and Administrative Taxonomy of Kannur District
// Taluks: Kannur, Taliparamba, Thalassery, Iritty, Payyanur
// ============================================================

export interface Stand {
  id: string;
  name: string;
  town: string;
  taluk: string;
  district: string;
}

export const KANNUR_STANDS: Stand[] = [

  // ══════════════════════════════════════════════════════════
  // I. KANNUR MUNICIPAL CORPORATION WARDS
  // ══════════════════════════════════════════════════════════

  { id: "knr-palliyammoola",   name: "Palliyammoola Auto Stand",    town: "Palliyammoola",   taluk: "Kannur", district: "Kannur" },
  { id: "knr-kunnavu",         name: "Kunnavu Auto Stand",          town: "Kunnavu",         taluk: "Kannur", district: "Kannur" },
  { id: "knr-kokkenpara",      name: "Kokkenpara Auto Stand",       town: "Kokkenpara",      taluk: "Kannur", district: "Kannur" },
  { id: "knr-pallikkunnu",     name: "Pallikkunnu Auto Stand",      town: "Pallikkunnu",     taluk: "Kannur", district: "Kannur" },
  { id: "knr-thalappu",        name: "Thalappu Auto Stand",         town: "Thalappu",        taluk: "Kannur", district: "Kannur" },
  { id: "knr-udayamkunnu",     name: "Udayamkunnu Auto Stand",      town: "Udayamkunnu",     taluk: "Kannur", district: "Kannur" },
  { id: "knr-podikundu",       name: "Podikundu Auto Stand",        town: "Podikundu",       taluk: "Kannur", district: "Kannur" },
  { id: "knr-kottali",         name: "Kottali Auto Stand",          town: "Kottali",         taluk: "Kannur", district: "Kannur" },
  { id: "knr-athazhakunnu",    name: "Athazhakunnu Auto Stand",     town: "Athazhakunnu",    taluk: "Kannur", district: "Kannur" },
  { id: "knr-kakkadu",         name: "Kakkadu Auto Stand",          town: "Kakkadu",         taluk: "Kannur", district: "Kannur" },
  { id: "knr-thulicheri",      name: "Thulicheri Auto Stand",       town: "Thulicheri",      taluk: "Kannur", district: "Kannur" },
  { id: "knr-kakkadu-north",   name: "Kakkadu North Auto Stand",    town: "Kakkadu North",   taluk: "Kannur", district: "Kannur" },
  { id: "knr-shadhulipalli",   name: "Shadhulipalli Auto Stand",    town: "Shadhulipalli",   taluk: "Kannur", district: "Kannur" },
  { id: "knr-pallipram",       name: "Pallipram Auto Stand",        town: "Pallipram",       taluk: "Kannur", district: "Kannur" },
  { id: "knr-varam",           name: "Varam Auto Stand",            town: "Varam",           taluk: "Kannur", district: "Kannur" },
  { id: "knr-valiyannoor",     name: "Valiyannoor Auto Stand",      town: "Valiyannoor",     taluk: "Kannur", district: "Kannur" },
  { id: "knr-chelora",         name: "Chelora Auto Stand",          town: "Chelora",         taluk: "Kannur", district: "Kannur" },
  { id: "knr-macheri",         name: "Macheri Auto Stand",          town: "Macheri",         taluk: "Kannur", district: "Kannur" },
  { id: "knr-pallipoyil",      name: "Pallipoyil Auto Stand",       town: "Pallipoyil",      taluk: "Kannur", district: "Kannur" },
  { id: "knr-kappadu",         name: "Kappadu Auto Stand",          town: "Kappadu",         taluk: "Kannur", district: "Kannur" },
  { id: "knr-elayavoor-north", name: "Elayavoor North Auto Stand",  town: "Elayavoor North", taluk: "Kannur", district: "Kannur" },
  { id: "knr-elayavoor-south", name: "Elayavoor South Auto Stand",  town: "Elayavoor South", taluk: "Kannur", district: "Kannur" },
  { id: "knr-mundayadu",       name: "Mundayadu Auto Stand",        town: "Mundayadu",       taluk: "Kannur", district: "Kannur" },
  { id: "knr-edachovva",       name: "Edachovva Auto Stand",        town: "Edachovva",       taluk: "Kannur", district: "Kannur" },
  { id: "knr-athirakam",       name: "Athirakam Auto Stand",        town: "Athirakam",       taluk: "Kannur", district: "Kannur" },
  { id: "knr-kappicheri",      name: "Kappicheri Auto Stand",       town: "Kappicheri",      taluk: "Kannur", district: "Kannur" },
  { id: "knr-mele-chovva",     name: "Mele Chovva Auto Stand",      town: "Mele Chovva",     taluk: "Kannur", district: "Kannur" },
  { id: "knr-thazhe-chovva",   name: "Thazhe Chovva Auto Stand",    town: "Thazhe Chovva",   taluk: "Kannur", district: "Kannur" },
  { id: "knr-kizhuthalli",     name: "Kizhuthalli Auto Stand",      town: "Kizhuthalli",     taluk: "Kannur", district: "Kannur" },
  { id: "knr-thilanoor",       name: "Thilanoor Auto Stand",        town: "Thilanoor",       taluk: "Kannur", district: "Kannur" },
  { id: "knr-attadappa",       name: "Attadappa Auto Stand",        town: "Attadappa",       taluk: "Kannur", district: "Kannur" },
  { id: "knr-chala",           name: "Chala Auto Stand",            town: "Chala",           taluk: "Kannur", district: "Kannur" },
  { id: "knr-edakkadu",        name: "Edakkadu Auto Stand",         town: "Edakkadu",        taluk: "Kannur", district: "Kannur" },
  { id: "knr-ezhara",          name: "Ezhara Auto Stand",           town: "Ezhara",          taluk: "Kannur", district: "Kannur" },
  { id: "knr-alinkeel",        name: "Alinkeel Auto Stand",         town: "Alinkeel",        taluk: "Kannur", district: "Kannur" },
  { id: "knr-keezhunna",       name: "Keezhunna Auto Stand",        town: "Keezhunna",       taluk: "Kannur", district: "Kannur" },
  { id: "knr-thottada",        name: "Thottada Auto Stand",         town: "Thottada",        taluk: "Kannur", district: "Kannur" },
  { id: "knr-adikadalai",      name: "Adikadalai Auto Stand",       town: "Adikadalai",      taluk: "Kannur", district: "Kannur" },
  { id: "knr-kanhira",         name: "Kanhira Auto Stand",          town: "Kanhira",         taluk: "Kannur", district: "Kannur" },
  { id: "knr-kuruva",          name: "Kuruva Auto Stand",           town: "Kuruva",          taluk: "Kannur", district: "Kannur" },
  { id: "knr-padanna",         name: "Padanna Auto Stand",          town: "Padanna",         taluk: "Kannur", district: "Kannur" },
  { id: "knr-vethilapalli",    name: "Vethilapalli Auto Stand",     town: "Vethilapalli",    taluk: "Kannur", district: "Kannur" },
  { id: "knr-neerchal",        name: "Neerchal Auto Stand",         town: "Neerchal",        taluk: "Kannur", district: "Kannur" },
  { id: "knr-arakkal",         name: "Arakkal Auto Stand",          town: "Arakkal",         taluk: "Kannur", district: "Kannur" },
  { id: "knr-chovva",          name: "Chovva Auto Stand",           town: "Chovva",          taluk: "Kannur", district: "Kannur" },
  { id: "knr-thana",           name: "Thana Auto Stand",            town: "Thana",           taluk: "Kannur", district: "Kannur" },
  { id: "knr-south-bazaar",    name: "South Bazaar Auto Stand",     town: "South Bazaar",    taluk: "Kannur", district: "Kannur" },
  { id: "knr-temple",          name: "Temple Auto Stand",           town: "Temple",          taluk: "Kannur", district: "Kannur" },
  { id: "knr-thayatheru",      name: "Thayatheru Auto Stand",       town: "Thayatheru",      taluk: "Kannur", district: "Kannur" },
  { id: "knr-kasanakotta",     name: "Kasanakotta Auto Stand",      town: "Kasanakotta",     taluk: "Kannur", district: "Kannur" },
  { id: "knr-ayikkara",        name: "Ayikkara Auto Stand",         town: "Ayikkara",        taluk: "Kannur", district: "Kannur" },
  { id: "knr-kanathoor",       name: "Kanathoor Auto Stand",        town: "Kanathoor",       taluk: "Kannur", district: "Kannur" },
  { id: "knr-payyambalam",     name: "Payyambalam Auto Stand",      town: "Payyambalam",     taluk: "Kannur", district: "Kannur" },
  { id: "knr-thalikkavu",      name: "Thalikkavu Auto Stand",       town: "Thalikkavu",      taluk: "Kannur", district: "Kannur" },
  { id: "knr-chalad",          name: "Chalad Auto Stand",           town: "Chalad",          taluk: "Kannur", district: "Kannur" },
  { id: "knr-panjikkayil",     name: "Panjikkayil Auto Stand",      town: "Panjikkayil",     taluk: "Kannur", district: "Kannur" },

  // ══════════════════════════════════════════════════════════
  // II. KANNUR TALUK — Revenue Villages
  // ══════════════════════════════════════════════════════════

  { id: "knr-newbus",          name: "Thavakkara New Bus Stand Auto Stand", town: "Kannur",            taluk: "Kannur", district: "Kannur" },
  { id: "knr-oldbus",          name: "Old Bus Stand Auto Stand",            town: "Kannur",            taluk: "Kannur", district: "Kannur" },
  { id: "knr-citybus",         name: "City Bus Stand Auto Stand",           town: "Kannur",            taluk: "Kannur", district: "Kannur" },
  { id: "knr-caltex",          name: "Caltex KSRTC Auto Stand",             town: "Kannur",            taluk: "Kannur", district: "Kannur" },
  { id: "knr-railway",         name: "Railway Station Auto Stand",          town: "Kannur",            taluk: "Kannur", district: "Kannur" },
  { id: "knr-cantonment",      name: "Cantonment Auto Stand",               town: "Kannur Cantonment", taluk: "Kannur", district: "Kannur" },
  { id: "knr-anjarakandi",     name: "Anjarakandi Auto Stand",              town: "Anjarakandi",       taluk: "Kannur", district: "Kannur" },
  { id: "knr-azhikode-north",  name: "Azhikode North Auto Stand",           town: "Azhikode North",    taluk: "Kannur", district: "Kannur" },
  { id: "knr-azhikode-south",  name: "Azhikode South Auto Stand",           town: "Azhikode South",    taluk: "Kannur", district: "Kannur" },
  { id: "knr-chembilode",      name: "Chembilode Auto Stand",               town: "Chembilode",        taluk: "Kannur", district: "Kannur" },
  { id: "knr-cherukkunnu",     name: "Cherukkunnu Auto Stand",              town: "Cherukkunnu",       taluk: "Kannur", district: "Kannur" },
  { id: "knr-chirakkal",       name: "Chirakkal Auto Stand",                town: "Chirakkal",         taluk: "Kannur", district: "Kannur" },
  { id: "knr-edakkad",         name: "Edakkad Auto Stand",                  town: "Edakkad",           taluk: "Kannur", district: "Kannur" },
  { id: "knr-elayavoor",       name: "Elayavoor Auto Stand",                town: "Elayavoor",         taluk: "Kannur", district: "Kannur" },
  { id: "knr-iriveri",         name: "Iriveri Auto Stand",                  town: "Iriveri",           taluk: "Kannur", district: "Kannur" },
  { id: "knr-kadambur",        name: "Kadambur Auto Stand",                 town: "Kadambur",          taluk: "Kannur", district: "Kannur" },
  { id: "knr-kalliasseri",     name: "Kalliasseri Auto Stand",              town: "Kalliasseri",       taluk: "Kannur", district: "Kannur" },
  { id: "knr-kanhirod",        name: "Kanhirod Auto Stand",                 town: "Kanhirod",          taluk: "Kannur", district: "Kannur" },
  { id: "knr-kannadiparamba",  name: "Kannadiparamba Auto Stand",           town: "Kannadiparamba",    taluk: "Kannur", district: "Kannur" },
  { id: "knr-kannapuram",      name: "Kannapuram Auto Stand",               town: "Kannapuram",        taluk: "Kannur", district: "Kannur" },
  { id: "knr-kannur-1",        name: "Kannur-1 Auto Stand",                 town: "Kannur-1",          taluk: "Kannur", district: "Kannur" },
  { id: "knr-kannur-2",        name: "Kannur-2 Auto Stand",                 town: "Kannur-2",          taluk: "Kannur", district: "Kannur" },
  { id: "knr-makrery",         name: "Makrery Auto Stand",                  town: "Makrery",           taluk: "Kannur", district: "Kannur" },
  { id: "knr-mattool",         name: "Mattool Auto Stand",                  town: "Mattool",           taluk: "Kannur", district: "Kannur" },
  { id: "knr-mavilayi",        name: "Mavilayi Auto Stand",                 town: "Mavilayi",          taluk: "Kannur", district: "Kannur" },
  { id: "knr-munderi",         name: "Munderi Auto Stand",                  town: "Munderi",           taluk: "Kannur", district: "Kannur" },
  { id: "knr-muzhappilangad",  name: "Muzhappilangad Auto Stand",           town: "Muzhappilangad",    taluk: "Kannur", district: "Kannur" },
  { id: "knr-narath",          name: "Narath Auto Stand",                   town: "Narath",            taluk: "Kannur", district: "Kannur" },
  { id: "knr-pappinisseri",    name: "Pappinisseri Auto Stand",             town: "Pappinisseri",      taluk: "Kannur", district: "Kannur" },
  { id: "knr-puzhathi",        name: "Puzhathi Auto Stand",                 town: "Puzhathi",          taluk: "Kannur", district: "Kannur" },
  { id: "knr-valapattanam",    name: "Valapattanam Auto Stand",             town: "Valapattanam",      taluk: "Kannur", district: "Kannur" },
  { id: "knr-valiyannur",      name: "Valiyannur Auto Stand",               town: "Valiyannur",        taluk: "Kannur", district: "Kannur" },

  // ══════════════════════════════════════════════════════════
  // III. TALIPARAMBA TALUK
  // ══════════════════════════════════════════════════════════

  { id: "tlp-busstand",        name: "Taliparamba Bus Stand Auto Stand",    town: "Taliparamba",     taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-alakode",         name: "Alakode Bus Stand Auto Stand",        town: "Alakode",         taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-anthoor",         name: "Anthoor Auto Stand",                  town: "Anthoor",         taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-chelery",         name: "Chelery Auto Stand",                  town: "Chelery",         taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-chengalayi",      name: "Chengalayi Auto Stand",               town: "Chengalayi",      taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-chuzhali",        name: "Chuzhali Auto Stand",                 town: "Chuzhali",        taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-eruvessi",        name: "Eruvessi Auto Stand",                 town: "Eruvessi",        taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-irikkur",         name: "Irikkur Bus Stand Auto Stand",        town: "Irikkur",         taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-kayaralam",       name: "Kayaralam Auto Stand",                town: "Kayaralam",       taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-kolachery",       name: "Kolachery Auto Stand",                town: "Kolachery",       taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-kooveri",         name: "Kooveri Auto Stand",                  town: "Kooveri",         taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-kurumathur",      name: "Kurumathur Auto Stand",               town: "Kurumathur",      taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-kuttiyattoor",    name: "Kuttiyattoor Auto Stand",             town: "Kuttiyattoor",    taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-kuttiyeri",       name: "Kuttiyeri Auto Stand",                town: "Kuttiyeri",       taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-malappattam",     name: "Malappattam Auto Stand",              town: "Malappattam",     taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-maniyoor",        name: "Maniyoor Auto Stand",                 town: "Maniyoor",        taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-mayyil",          name: "Mayyil Bus Station Auto Stand",       town: "Mayyil",          taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-morazha",         name: "Morazha Auto Stand",                  town: "Morazha",         taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-naduvil",         name: "Naduvil Auto Stand",                  town: "Naduvil",         taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-nidiyanga",       name: "Nidiyanga Auto Stand",                town: "Nidiyanga",       taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-panniyoor",       name: "Panniyoor Auto Stand",                town: "Panniyoor",       taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-pariyaram",       name: "Medical College Auto Stand",          town: "Pariyaram",       taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-pattuvam",        name: "Pattuvam Auto Stand",                 town: "Pattuvam",        taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-payyavoor",       name: "Payyavoor Auto Stand",                town: "Payyavoor",       taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-sreekandapuram",  name: "Sreekandapuram Auto Stand",           town: "Sreekandapuram",  taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-thimiri",         name: "Thimiri Auto Stand",                  town: "Thimiri",         taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-udayagiri",       name: "Udayagiri Auto Stand",                town: "Udayagiri",       taluk: "Taliparamba", district: "Kannur" },
  { id: "tlp-velladu",         name: "Velladu Auto Stand",                  town: "Velladu",         taluk: "Taliparamba", district: "Kannur" },

  // ══════════════════════════════════════════════════════════
  // IV. THALASSERY TALUK
  // ══════════════════════════════════════════════════════════

  { id: "tls-newbus",          name: "Thalassery New Bus Stand Auto Stand", town: "Thalassery",      taluk: "Thalassery", district: "Kannur" },
  { id: "tls-oldbus",          name: "Thalassery Old Bus Stand Auto Stand", town: "Thalassery",      taluk: "Thalassery", district: "Kannur" },
  { id: "tls-railway",         name: "Thalassery Railway Station Auto Stand", town: "Thalassery",    taluk: "Thalassery", district: "Kannur" },
  { id: "tls-cheruvanchery",   name: "Cheruvanchery Auto Stand",            town: "Cheruvanchery",   taluk: "Thalassery", district: "Kannur" },
  { id: "tls-chokli",          name: "Chokli Auto Stand",                   town: "Chokli",          taluk: "Thalassery", district: "Kannur" },
  { id: "tls-dharmadam",       name: "Dharmadam Auto Stand",                town: "Dharmadam",       taluk: "Thalassery", district: "Kannur" },
  { id: "tls-erancholi",       name: "Erancholi Auto Stand",                town: "Erancholi",       taluk: "Thalassery", district: "Kannur" },
  { id: "tls-eruvatty",        name: "Eruvatty Auto Stand",                 town: "Eruvatty",        taluk: "Thalassery", district: "Kannur" },
  { id: "tls-kadirur",         name: "Kadirur Auto Stand",                  town: "Kadirur",         taluk: "Thalassery", district: "Kannur" },
  { id: "tls-kandamkunnu",     name: "Kandamkunnu Auto Stand",              town: "Kandamkunnu",     taluk: "Thalassery", district: "Kannur" },
  { id: "tls-kannavam",        name: "Kannavam Auto Stand",                 town: "Kannavam",        taluk: "Thalassery", district: "Kannur" },
  { id: "tls-keezhallur",      name: "Keezhallur Auto Stand",               town: "Keezhallur",      taluk: "Thalassery", district: "Kannur" },
  { id: "tls-kodiyeri",        name: "Kodiyeri Auto Stand",                 town: "Kodiyeri",        taluk: "Thalassery", district: "Kannur" },
  { id: "tls-kolavallur",      name: "Kolavallur Auto Stand",               town: "Kolavallur",      taluk: "Thalassery", district: "Kannur" },
  { id: "tls-kolayad",         name: "Kolayad Auto Stand",                  town: "Kolayad",         taluk: "Thalassery", district: "Kannur" },
  { id: "tls-koodali",         name: "Koodali Auto Stand",                  town: "Koodali",         taluk: "Thalassery", district: "Kannur" },
  { id: "tls-kottayam",        name: "Kottayam Auto Stand",                 town: "Kottayam",        taluk: "Thalassery", district: "Kannur" },
  { id: "tls-koothuparamba",   name: "Koothuparamba Bus Stand Auto Stand",  town: "Kuthuparamba",    taluk: "Thalassery", district: "Kannur" },
  { id: "tls-manantheri",      name: "Manantheri Auto Stand",               town: "Manantheri",      taluk: "Thalassery", district: "Kannur" },
  { id: "tls-mangattidam",     name: "Mangattidam Auto Stand",              town: "Mangattidam",     taluk: "Thalassery", district: "Kannur" },
  { id: "tls-mokery",          name: "Mokery Auto Stand",                   town: "Mokery",          taluk: "Thalassery", district: "Kannur" },
  { id: "tls-new-mahe",        name: "New Mahe Auto Stand",                 town: "New Mahe",        taluk: "Thalassery", district: "Kannur" },
  { id: "tls-paduvilayi",      name: "Paduvilayi Auto Stand",               town: "Paduvilayi",      taluk: "Thalassery", district: "Kannur" },
  { id: "tls-panniyannur",     name: "Panniyannur Auto Stand",              town: "Panniyannur",     taluk: "Thalassery", district: "Kannur" },
  { id: "tls-panoor",          name: "Panoor Bus Stand Auto Stand",         town: "Panoor",          taluk: "Thalassery", district: "Kannur" },
  { id: "tls-pathiriyad",      name: "Pathiriyad Auto Stand",               town: "Pathiriyad",      taluk: "Thalassery", district: "Kannur" },
  { id: "tls-pattanur",        name: "Pattanur Auto Stand",                 town: "Pattanur",        taluk: "Thalassery", district: "Kannur" },
  { id: "tls-pattiam",         name: "Pattiam Auto Stand",                  town: "Pattiam",         taluk: "Thalassery", district: "Kannur" },
  { id: "tls-peringalam",      name: "Peringalam Auto Stand",               town: "Peringalam",      taluk: "Thalassery", district: "Kannur" },
  { id: "tls-peringathur",     name: "Peringathur Auto Stand",              town: "Peringathur",     taluk: "Thalassery", district: "Kannur" },
  { id: "tls-pinarayi",        name: "Pinarayi Auto Stand",                 town: "Pinarayi",        taluk: "Thalassery", district: "Kannur" },
  { id: "tls-puthur",          name: "Puthur Auto Stand",                   town: "Puthur",          taluk: "Thalassery", district: "Kannur" },
  { id: "tls-shivapuram",      name: "Shivapuram Auto Stand",               town: "Shivapuram",      taluk: "Thalassery", district: "Kannur" },
  { id: "tls-thiruvangad",     name: "Thiruvangad Auto Stand",              town: "Thiruvangad",     taluk: "Thalassery", district: "Kannur" },
  { id: "tls-tholambra",       name: "Tholambra Auto Stand",                town: "Tholambra",       taluk: "Thalassery", district: "Kannur" },
  { id: "tls-thripangottur",   name: "Thripangottur Auto Stand",            town: "Thripangottur",   taluk: "Thalassery", district: "Kannur" },
  { id: "tls-vekkalam",        name: "Vekkalam Auto Stand",                 town: "Vekkalam",        taluk: "Thalassery", district: "Kannur" },

  // ══════════════════════════════════════════════════════════
  // V. IRITTY TALUK
  // ══════════════════════════════════════════════════════════

  { id: "irt-busstand",        name: "Iritty Bus Stand Auto Stand",         town: "Iritty",          taluk: "Iritty", district: "Kannur" },
  { id: "irt-mattannur",       name: "Mattannur Bus Stand Auto Stand",      town: "Mattannur",       taluk: "Iritty", district: "Kannur" },
  { id: "irt-aralam",          name: "Aralam Auto Stand",                   town: "Aralam",          taluk: "Iritty", district: "Kannur" },
  { id: "irt-ayyankunnu",      name: "Ayyankunnu Auto Stand",               town: "Ayyankunnu",      taluk: "Iritty", district: "Kannur" },
  { id: "irt-chavasseri",      name: "Chavasseri Auto Stand",               town: "Chavasseri",      taluk: "Iritty", district: "Kannur" },
  { id: "irt-kalliad",         name: "Kalliad Auto Stand",                  town: "Kalliad",         taluk: "Iritty", district: "Kannur" },
  { id: "irt-kanichar",        name: "Kanichar Auto Stand",                 town: "Kanichar",        taluk: "Iritty", district: "Kannur" },
  { id: "irt-karikottakari",   name: "Karikottakari Auto Stand",            town: "Karikottakari",   taluk: "Iritty", district: "Kannur" },
  { id: "irt-keezhur",         name: "Keezhur Auto Stand",                  town: "Keezhur",         taluk: "Iritty", district: "Kannur" },
  { id: "irt-kelakam",         name: "Kelakam Bus Stand Auto Stand",        town: "Kelakam",         taluk: "Iritty", district: "Kannur" },
  { id: "irt-kolari",          name: "Kolari Auto Stand",                   town: "Kolari",          taluk: "Iritty", district: "Kannur" },
  { id: "irt-kottiyoor",       name: "Kottiyoor Auto Stand",                town: "Kottiyoor",       taluk: "Iritty", district: "Kannur" },
  { id: "irt-manathana",       name: "Manathana Auto Stand",                town: "Manathana",       taluk: "Iritty", district: "Kannur" },
  { id: "irt-muzhakkunnu",     name: "Muzhakkunnu Auto Stand",              town: "Muzhakkunnu",     taluk: "Iritty", district: "Kannur" },
  { id: "irt-nuchiyad",        name: "Nuchiyad Auto Stand",                 town: "Nuchiyad",        taluk: "Iritty", district: "Kannur" },
  { id: "irt-padiyoor",        name: "Padiyoor Auto Stand",                 town: "Padiyoor",        taluk: "Iritty", district: "Kannur" },
  { id: "irt-payam",           name: "Payam Auto Stand",                    town: "Payam",           taluk: "Iritty", district: "Kannur" },
  { id: "irt-pazhassi",        name: "Pazhassi Auto Stand",                 town: "Pazhassi",        taluk: "Iritty", district: "Kannur" },
  { id: "irt-thillankeri",     name: "Thillankeri Auto Stand",              town: "Thillankeri",     taluk: "Iritty", district: "Kannur" },
  { id: "irt-vayathur",        name: "Vayathur Auto Stand",                 town: "Vayathur",        taluk: "Iritty", district: "Kannur" },
  { id: "irt-vellarvalli",     name: "Vellarvalli Auto Stand",              town: "Vellarvalli",     taluk: "Iritty", district: "Kannur" },
  { id: "irt-vilamana",        name: "Vilamana Auto Stand",                 town: "Vilamana",        taluk: "Iritty", district: "Kannur" },

  // ══════════════════════════════════════════════════════════
  // VI. PAYYANUR TALUK
  // ══════════════════════════════════════════════════════════

  { id: "pyn-newbus",          name: "Payyanur New Bus Stand Auto Stand",   town: "Payyanur",        taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-oldbus",          name: "Payyanur Old Bus Stand Auto Stand",   town: "Payyanur",        taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-railway",         name: "Payyanur Railway Station Auto Stand", town: "Payyanur",        taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-alappadamba",     name: "Alappadamba Auto Stand",              town: "Alappadamba",     taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-cheruthazham",    name: "Cheruthazham Auto Stand",             town: "Cheruthazham",    taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-eramam",          name: "Eramam Auto Stand",                   town: "Eramam",          taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-ezhome",          name: "Ezhome Auto Stand",                   town: "Ezhome",          taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-kadannappally",   name: "Kadannnappally Auto Stand",           town: "Kadannnappally",  taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-kankol",          name: "Kankol Auto Stand",                   town: "Kankol",          taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-karivellur",      name: "Karivellur Auto Stand",               town: "Karivellur",      taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-korom",           name: "Korom Auto Stand",                    town: "Korom",           taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-kuttur",          name: "Kuttur Auto Stand",                   town: "Kuttur",          taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-kunhimangalam",   name: "Kunhimangalam Auto Stand",            town: "Kunhimangalam",   taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-madayi",          name: "Pazhayangadi Bus Stand",              town: "Madayi",          taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-panappuzha",      name: "Panappuzha Auto Stand",               town: "Panappuzha",      taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-peralam",         name: "Peralam Auto Stand",                  town: "Peralam",         taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-peringome",       name: "Peringome Auto Stand",                town: "Peringome",       taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-perinthatta",     name: "Perinthatta Auto Stand",              town: "Perinthatta",     taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-pulingome",       name: "Pulingome Auto Stand",                town: "Pulingome",       taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-ramanthali",      name: "Ramanthali Auto Stand",               town: "Ramanthali",      taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-thirumeni",       name: "Thirumeni Auto Stand",                town: "Thirumeni",       taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-vayakkara",       name: "Vayakkara Auto Stand",                town: "Vayakkara",       taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-vellora",         name: "Vellora Auto Stand",                  town: "Vellora",         taluk: "Payyanur", district: "Kannur" },
  { id: "pyn-vellur",          name: "Vellur Auto Stand",                   town: "Vellur",          taluk: "Payyanur", district: "Kannur" },
];

// ── Helper: get all unique towns in Kannur ────────────────────
export const KANNUR_TOWNS = [...new Set(KANNUR_STANDS.map(s => s.town))].sort();

// ── Helper: get stands by town name ──────────────────────────
export function getKannurStandsByTown(town: string): Stand[] {
  return KANNUR_STANDS.filter(s => s.town === town);
}

// ── Helper: get all unique taluks ────────────────────────────
export const KANNUR_TALUKS = [...new Set(KANNUR_STANDS.map(s => s.taluk))].sort();

// ── Helper: get towns by taluk ────────────────────────────────
export function getKannurTownsByTaluk(taluk: string): string[] {
  return [...new Set(
    KANNUR_STANDS.filter(s => s.taluk === taluk).map(s => s.town)
  )].sort();
}