/**
 * Maps ISO 3166-1 numeric codes (used by topojson world-atlas)
 * to ISO 3166-1 alpha-2 codes (used for flag URLs and API).
 * All ~195 UN-recognised countries included.
 */
export const ISO_NUMERIC_TO_ALPHA2: Record<string, string> = {
  "004": "af", // Afghanistan
  "008": "al", // Albania
  "012": "dz", // Algeria
  "024": "ao", // Angola
  "032": "ar", // Argentina
  "036": "au", // Australia
  "040": "at", // Austria
  "031": "az", // Azerbaijan
  "044": "bs", // Bahamas
  "048": "bh", // Bahrain
  "050": "bd", // Bangladesh
  "112": "by", // Belarus
  "056": "be", // Belgium
  "084": "bz", // Belize
  "204": "bj", // Benin
  "064": "bt", // Bhutan
  "068": "bo", // Bolivia
  "070": "ba", // Bosnia and Herzegovina
  "072": "bw", // Botswana
  "076": "br", // Brazil
  "096": "bn", // Brunei
  "100": "bg", // Bulgaria
  "854": "bf", // Burkina Faso
  "108": "bi", // Burundi
  "132": "cv", // Cabo Verde
  "116": "kh", // Cambodia
  "120": "cm", // Cameroon
  "124": "ca", // Canada
  "140": "cf", // Central African Republic
  "148": "td", // Chad
  "152": "cl", // Chile
  "104": "mm", // Myanmar
  "156": "cn", // China
  "158": "tw", // Taiwan
  "170": "co", // Colombia
  "174": "km", // Comoros
  "180": "cd", // Congo (DRC)
  "178": "cg", // Congo (Republic)
  "188": "cr", // Costa Rica
  "191": "hr", // Croatia
  "192": "cu", // Cuba
  "196": "cy", // Cyprus
  "203": "cz", // Czechia
  "208": "dk", // Denmark
  "262": "dj", // Djibouti
  "214": "do", // Dominican Republic
  "218": "ec", // Ecuador
  "818": "eg", // Egypt
  "222": "sv", // El Salvador
  "226": "gq", // Equatorial Guinea
  "232": "er", // Eritrea
  "233": "ee", // Estonia
  "748": "sz", // Eswatini
  "231": "et", // Ethiopia
  "246": "fi", // Finland
  "250": "fr", // France
  "266": "ga", // Gabon
  "270": "gm", // Gambia
  "268": "ge", // Georgia
  "276": "de", // Germany
  "288": "gh", // Ghana
  "300": "gr", // Greece
  "320": "gt", // Guatemala
  "324": "gn", // Guinea
  "624": "gw", // Guinea-Bissau
  "332": "ht", // Haiti
  "340": "hn", // Honduras
  "348": "hu", // Hungary
  "356": "in", // India
  "360": "id", // Indonesia
  "364": "ir", // Iran
  "368": "iq", // Iraq
  "372": "ie", // Ireland
  "376": "il", // Israel
  "380": "it", // Italy
  "388": "jm", // Jamaica
  "392": "jp", // Japan
  "400": "jo", // Jordan
  "398": "kz", // Kazakhstan
  "404": "ke", // Kenya
  "408": "kp", // North Korea
  "410": "kr", // South Korea
  "414": "kw", // Kuwait
  "417": "kg", // Kyrgyzstan
  "418": "la", // Laos
  "428": "lv", // Latvia
  "422": "lb", // Lebanon
  "426": "ls", // Lesotho
  "430": "lr", // Liberia
  "434": "ly", // Libya
  "440": "lt", // Lithuania
  "442": "lu", // Luxembourg
  "450": "mg", // Madagascar
  "454": "mw", // Malawi
  "458": "my", // Malaysia
  "462": "mv", // Maldives
  "466": "ml", // Mali
  "478": "mr", // Mauritania
  "484": "mx", // Mexico
  "496": "mn", // Mongolia
  "504": "ma", // Morocco
  "508": "mz", // Mozambique
  "516": "na", // Namibia
  "524": "np", // Nepal
  "528": "nl", // Netherlands
  "554": "nz", // New Zealand
  "558": "ni", // Nicaragua
  "562": "ne", // Niger
  "566": "ng", // Nigeria
  "807": "mk", // North Macedonia
  "578": "no", // Norway
  "512": "om", // Oman
  "586": "pk", // Pakistan
  "591": "pa", // Panama
  "598": "pg", // Papua New Guinea
  "600": "py", // Paraguay
  "604": "pe", // Peru
  "608": "ph", // Philippines
  "616": "pl", // Poland
  "620": "pt", // Portugal
  "634": "qa", // Qatar
  "642": "ro", // Romania
  "643": "ru", // Russia
  "646": "rw", // Rwanda
  "682": "sa", // Saudi Arabia
  "686": "sn", // Senegal
  "694": "sl", // Sierra Leone
  "706": "so", // Somalia
  "710": "za", // South Africa
  "728": "ss", // South Sudan
  "724": "es", // Spain
  "144": "lk", // Sri Lanka
  "729": "sd", // Sudan
  "740": "sr", // Suriname
  "752": "se", // Sweden
  "756": "ch", // Switzerland
  "760": "sy", // Syria
  "762": "tj", // Tajikistan
  "834": "tz", // Tanzania
  "764": "th", // Thailand
  "768": "tg", // Togo
  "788": "tn", // Tunisia
  "792": "tr", // Turkey (Türkiye)
  "795": "tm", // Turkmenistan
  "800": "ug", // Uganda
  "804": "ua", // Ukraine
  "784": "ae", // United Arab Emirates
  "826": "gb", // United Kingdom
  "840": "us", // United States
  "858": "uy", // Uruguay
  "860": "uz", // Uzbekistan
  "862": "ve", // Venezuela
  "626": "tl", // Timor-Leste
  "275": "ps", // Palestine
  "704": "vn", // Vietnam
  "887": "ye", // Yemen
  "894": "zm", // Zambia
  "716": "zw", // Zimbabwe
  "020": "ad", // Andorra
  "028": "ag", // Antigua and Barbuda
  "051": "am", // Armenia
  "533": "aw", // Aruba
  "052": "bb", // Barbados
  "060": "bm", // Bermuda
  "184": "ck", // Cook Islands
  "212": "dm", // Dominica
  "238": "fk", // Falkland Islands
  "242": "fj", // Fiji
  "308": "gd", // Grenada
  "328": "gy", // Guyana
  "352": "is", // Iceland
  "296": "ki", // Kiribati
  "438": "li", // Liechtenstein
  "480": "mu", // Mauritius
  "583": "fm", // Micronesia
  "498": "md", // Moldova
  "492": "mc", // Monaco
  "520": "nr", // Nauru
  "570": "nu", // Niue
  "580": "mp", // Northern Mariana Islands
  "585": "pw", // Palau
  "548": "vu", // Vanuatu
  "882": "ws", // Samoa
  "674": "sm", // San Marino
  "678": "st", // Sao Tome and Principe
  "690": "sc", // Seychelles
  "702": "sg", // Singapore
  "703": "sk", // Slovakia
  "705": "si", // Slovenia
  "090": "sb", // Solomon Islands
  "659": "kn", // Saint Kitts and Nevis
  "662": "lc", // Saint Lucia
  "670": "vc", // Saint Vincent and the Grenadines
  "776": "to", // Tonga
  "780": "tt", // Trinidad and Tobago
  "798": "tv", // Tuvalu
  "336": "va", // Vatican City
  "384": "ci", // Ivory Coast (Côte d'Ivoire)
  "499": "me", // Montenegro
  "470": "mt", // Malta
  "688": "rs", // Serbia
  "383": "xk", // Kosovo (provisional ISO)
  "732": "eh", // Western Sahara
};

/**
 * Reverse map: alpha-2 → numeric
 */
export const ALPHA2_TO_NUMERIC: Record<string, string> = Object.fromEntries(
  Object.entries(ISO_NUMERIC_TO_ALPHA2).map(([num, a2]) => [a2, num])
);

/**
 * Country names keyed by alpha-2 code.
 */
export const COUNTRY_NAMES: Record<string, string> = {
  af: "Afghanistan",
  al: "Albania",
  dz: "Algeria",
  ao: "Angola",
  ar: "Argentina",
  am: "Armenia",
  au: "Australia",
  at: "Austria",
  az: "Azerbaijan",
  bs: "Bahamas",
  bh: "Bahrain",
  bd: "Bangladesh",
  by: "Belarus",
  be: "Belgium",
  bz: "Belize",
  bj: "Benin",
  bt: "Bhutan",
  bo: "Bolivia",
  ba: "Bosnia and Herzegovina",
  bw: "Botswana",
  br: "Brazil",
  bn: "Brunei",
  bg: "Bulgaria",
  bf: "Burkina Faso",
  bi: "Burundi",
  cv: "Cabo Verde",
  kh: "Cambodia",
  cm: "Cameroon",
  ca: "Canada",
  cf: "Central African Republic",
  td: "Chad",
  cl: "Chile",
  cn: "China",
  co: "Colombia",
  km: "Comoros",
  cd: "DR Congo",
  cg: "Congo",
  cr: "Costa Rica",
  hr: "Croatia",
  cu: "Cuba",
  cy: "Cyprus",
  cz: "Czechia",
  dk: "Denmark",
  dj: "Djibouti",
  do: "Dominican Republic",
  ec: "Ecuador",
  eg: "Egypt",
  sv: "El Salvador",
  gq: "Equatorial Guinea",
  er: "Eritrea",
  ee: "Estonia",
  sz: "Eswatini",
  et: "Ethiopia",
  fj: "Fiji",
  fi: "Finland",
  fr: "France",
  ga: "Gabon",
  gm: "Gambia",
  ge: "Georgia",
  de: "Germany",
  gh: "Ghana",
  gr: "Greece",
  gd: "Grenada",
  gt: "Guatemala",
  gn: "Guinea",
  gw: "Guinea-Bissau",
  gy: "Guyana",
  ht: "Haiti",
  hn: "Honduras",
  hu: "Hungary",
  is: "Iceland",
  in: "India",
  id: "Indonesia",
  ir: "Iran",
  iq: "Iraq",
  ie: "Ireland",
  il: "Israel",
  it: "Italy",
  jm: "Jamaica",
  jp: "Japan",
  jo: "Jordan",
  kz: "Kazakhstan",
  ke: "Kenya",
  ki: "Kiribati",
  kp: "North Korea",
  kr: "South Korea",
  kw: "Kuwait",
  kg: "Kyrgyzstan",
  la: "Laos",
  lv: "Latvia",
  lb: "Lebanon",
  ls: "Lesotho",
  lr: "Liberia",
  ly: "Libya",
  li: "Liechtenstein",
  lt: "Lithuania",
  lu: "Luxembourg",
  mg: "Madagascar",
  mw: "Malawi",
  my: "Malaysia",
  mv: "Maldives",
  ml: "Mali",
  mt: "Malta",
  mh: "Marshall Islands",
  mr: "Mauritania",
  mu: "Mauritius",
  mx: "Mexico",
  fm: "Micronesia",
  md: "Moldova",
  mc: "Monaco",
  mn: "Mongolia",
  me: "Montenegro",
  ma: "Morocco",
  mz: "Mozambique",
  mm: "Myanmar",
  na: "Namibia",
  nr: "Nauru",
  np: "Nepal",
  nl: "Netherlands",
  nz: "New Zealand",
  ni: "Nicaragua",
  ne: "Niger",
  ng: "Nigeria",
  mk: "North Macedonia",
  no: "Norway",
  om: "Oman",
  pk: "Pakistan",
  pw: "Palau",
  pa: "Panama",
  pg: "Papua New Guinea",
  py: "Paraguay",
  pe: "Peru",
  ph: "Philippines",
  pl: "Poland",
  pt: "Portugal",
  qa: "Qatar",
  ro: "Romania",
  ru: "Russia",
  rw: "Rwanda",
  kn: "Saint Kitts and Nevis",
  lc: "Saint Lucia",
  vc: "Saint Vincent and the Grenadines",
  ws: "Samoa",
  sm: "San Marino",
  st: "Sao Tome and Principe",
  sa: "Saudi Arabia",
  sn: "Senegal",
  rs: "Serbia",
  sc: "Seychelles",
  sl: "Sierra Leone",
  sg: "Singapore",
  sk: "Slovakia",
  si: "Slovenia",
  sb: "Solomon Islands",
  so: "Somalia",
  za: "South Africa",
  ss: "South Sudan",
  es: "Spain",
  lk: "Sri Lanka",
  sd: "Sudan",
  sr: "Suriname",
  se: "Sweden",
  ch: "Switzerland",
  sy: "Syria",
  tj: "Tajikistan",
  tz: "Tanzania",
  th: "Thailand",
  tl: "Timor-Leste",
  tw: "Taiwan",
  ps: "Palestine",
  tg: "Togo",
  to: "Tonga",
  tt: "Trinidad and Tobago",
  tn: "Tunisia",
  tr: "Turkey",
  tm: "Turkmenistan",
  tv: "Tuvalu",
  ug: "Uganda",
  ua: "Ukraine",
  ae: "United Arab Emirates",
  gb: "United Kingdom",
  us: "United States",
  uy: "Uruguay",
  uz: "Uzbekistan",
  vu: "Vanuatu",
  va: "Vatican City",
  ve: "Venezuela",
  vn: "Vietnam",
  ye: "Yemen",
  zm: "Zambia",
  zw: "Zimbabwe",
  ci: "Ivory Coast",
  xk: "Kosovo",
  eh: "Western Sahara",
};
