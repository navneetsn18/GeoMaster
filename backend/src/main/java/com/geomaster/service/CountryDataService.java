package com.geomaster.service;

import com.geomaster.model.enums.MapType;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class CountryDataService {

    public record Country(String code, String name, String continent) {
        public String flagUrl() {
            // Subdivision codes (e.g. IN-AP, US-CA) — use parent country flag
            if (code.contains("-")) {
                String parent = code.substring(0, 2).toLowerCase();
                return "https://flagcdn.com/w40/" + parent + ".png";
            }
            return "https://flagcdn.com/w40/" + code.toLowerCase() + ".png";
        }
    }

    // Continent codes: AF=Africa, AS=Asia, EU=Europe, NA=North America, SA=South America, OC=Oceania, AN=Antarctica
    private static final List<Country> ALL_COUNTRIES = List.of(
        // Africa (AF)
        new Country("DZ", "Algeria", "AF"),
        new Country("AO", "Angola", "AF"),
        new Country("BJ", "Benin", "AF"),
        new Country("BW", "Botswana", "AF"),
        new Country("BF", "Burkina Faso", "AF"),
        new Country("BI", "Burundi", "AF"),
        new Country("CV", "Cape Verde", "AF"),
        new Country("CM", "Cameroon", "AF"),
        new Country("CF", "Central African Republic", "AF"),
        new Country("TD", "Chad", "AF"),
        new Country("KM", "Comoros", "AF"),
        new Country("CG", "Republic of the Congo", "AF"),
        new Country("CD", "Democratic Republic of the Congo", "AF"),
        new Country("DJ", "Djibouti", "AF"),
        new Country("EG", "Egypt", "AF"),
        new Country("GQ", "Equatorial Guinea", "AF"),
        new Country("ER", "Eritrea", "AF"),
        new Country("SZ", "Eswatini", "AF"),
        new Country("ET", "Ethiopia", "AF"),
        new Country("GA", "Gabon", "AF"),
        new Country("GM", "Gambia", "AF"),
        new Country("GH", "Ghana", "AF"),
        new Country("GN", "Guinea", "AF"),
        new Country("GW", "Guinea-Bissau", "AF"),
        new Country("CI", "Ivory Coast", "AF"),
        new Country("KE", "Kenya", "AF"),
        new Country("LS", "Lesotho", "AF"),
        new Country("LR", "Liberia", "AF"),
        new Country("LY", "Libya", "AF"),
        new Country("MG", "Madagascar", "AF"),
        new Country("MW", "Malawi", "AF"),
        new Country("ML", "Mali", "AF"),
        new Country("MR", "Mauritania", "AF"),
        new Country("MU", "Mauritius", "AF"),
        new Country("MA", "Morocco", "AF"),
        new Country("MZ", "Mozambique", "AF"),
        new Country("NA", "Namibia", "AF"),
        new Country("NE", "Niger", "AF"),
        new Country("NG", "Nigeria", "AF"),
        new Country("RW", "Rwanda", "AF"),
        new Country("ST", "Sao Tome and Principe", "AF"),
        new Country("SN", "Senegal", "AF"),
        new Country("SC", "Seychelles", "AF"),
        new Country("SL", "Sierra Leone", "AF"),
        new Country("SO", "Somalia", "AF"),
        new Country("ZA", "South Africa", "AF"),
        new Country("SS", "South Sudan", "AF"),
        new Country("SD", "Sudan", "AF"),
        new Country("TZ", "Tanzania", "AF"),
        new Country("TG", "Togo", "AF"),
        new Country("TN", "Tunisia", "AF"),
        new Country("UG", "Uganda", "AF"),
        new Country("ZM", "Zambia", "AF"),
        new Country("ZW", "Zimbabwe", "AF"),

        // Asia (AS)
        new Country("AF", "Afghanistan", "AS"),
        new Country("AM", "Armenia", "AS"),
        new Country("AZ", "Azerbaijan", "AS"),
        new Country("BH", "Bahrain", "AS"),
        new Country("BD", "Bangladesh", "AS"),
        new Country("BT", "Bhutan", "AS"),
        new Country("BN", "Brunei", "AS"),
        new Country("KH", "Cambodia", "AS"),
        new Country("CN", "China", "AS"),
        new Country("CY", "Cyprus", "AS"),
        new Country("GE", "Georgia", "AS"),
        new Country("IN", "India", "AS"),
        new Country("ID", "Indonesia", "AS"),
        new Country("IR", "Iran", "AS"),
        new Country("IQ", "Iraq", "AS"),
        new Country("IL", "Israel", "AS"),
        new Country("JP", "Japan", "AS"),
        new Country("JO", "Jordan", "AS"),
        new Country("KZ", "Kazakhstan", "AS"),
        new Country("KW", "Kuwait", "AS"),
        new Country("KG", "Kyrgyzstan", "AS"),
        new Country("LA", "Laos", "AS"),
        new Country("LB", "Lebanon", "AS"),
        new Country("MY", "Malaysia", "AS"),
        new Country("MV", "Maldives", "AS"),
        new Country("MN", "Mongolia", "AS"),
        new Country("MM", "Myanmar", "AS"),
        new Country("NP", "Nepal", "AS"),
        new Country("KP", "North Korea", "AS"),
        new Country("OM", "Oman", "AS"),
        new Country("PK", "Pakistan", "AS"),
        new Country("PS", "Palestine", "AS"),
        new Country("PH", "Philippines", "AS"),
        new Country("QA", "Qatar", "AS"),
        new Country("SA", "Saudi Arabia", "AS"),
        new Country("SG", "Singapore", "AS"),
        new Country("KR", "South Korea", "AS"),
        new Country("LK", "Sri Lanka", "AS"),
        new Country("SY", "Syria", "AS"),
        new Country("TW", "Taiwan", "AS"),
        new Country("TJ", "Tajikistan", "AS"),
        new Country("TH", "Thailand", "AS"),
        new Country("TL", "Timor-Leste", "AS"),
        new Country("TR", "Turkey", "AS"),
        new Country("TM", "Turkmenistan", "AS"),
        new Country("AE", "United Arab Emirates", "AS"),
        new Country("UZ", "Uzbekistan", "AS"),
        new Country("VN", "Vietnam", "AS"),
        new Country("YE", "Yemen", "AS"),

        // Europe (EU)
        new Country("AL", "Albania", "EU"),
        new Country("AD", "Andorra", "EU"),
        new Country("AT", "Austria", "EU"),
        new Country("BY", "Belarus", "EU"),
        new Country("BE", "Belgium", "EU"),
        new Country("BA", "Bosnia and Herzegovina", "EU"),
        new Country("BG", "Bulgaria", "EU"),
        new Country("HR", "Croatia", "EU"),
        new Country("CZ", "Czech Republic", "EU"),
        new Country("DK", "Denmark", "EU"),
        new Country("EE", "Estonia", "EU"),
        new Country("FI", "Finland", "EU"),
        new Country("FR", "France", "EU"),
        new Country("DE", "Germany", "EU"),
        new Country("GR", "Greece", "EU"),
        new Country("HU", "Hungary", "EU"),
        new Country("IS", "Iceland", "EU"),
        new Country("IE", "Ireland", "EU"),
        new Country("IT", "Italy", "EU"),
        new Country("XK", "Kosovo", "EU"),
        new Country("LV", "Latvia", "EU"),
        new Country("LI", "Liechtenstein", "EU"),
        new Country("LT", "Lithuania", "EU"),
        new Country("LU", "Luxembourg", "EU"),
        new Country("MT", "Malta", "EU"),
        new Country("MD", "Moldova", "EU"),
        new Country("MC", "Monaco", "EU"),
        new Country("ME", "Montenegro", "EU"),
        new Country("NL", "Netherlands", "EU"),
        new Country("MK", "North Macedonia", "EU"),
        new Country("NO", "Norway", "EU"),
        new Country("PL", "Poland", "EU"),
        new Country("PT", "Portugal", "EU"),
        new Country("RO", "Romania", "EU"),
        new Country("RU", "Russia", "EU"),
        new Country("SM", "San Marino", "EU"),
        new Country("RS", "Serbia", "EU"),
        new Country("SK", "Slovakia", "EU"),
        new Country("SI", "Slovenia", "EU"),
        new Country("ES", "Spain", "EU"),
        new Country("SE", "Sweden", "EU"),
        new Country("CH", "Switzerland", "EU"),
        new Country("UA", "Ukraine", "EU"),
        new Country("GB", "United Kingdom", "EU"),
        new Country("VA", "Vatican City", "EU"),

        // North America (NA)
        new Country("AG", "Antigua and Barbuda", "NA"),
        new Country("BS", "Bahamas", "NA"),
        new Country("BB", "Barbados", "NA"),
        new Country("BZ", "Belize", "NA"),
        new Country("CA", "Canada", "NA"),
        new Country("CR", "Costa Rica", "NA"),
        new Country("CU", "Cuba", "NA"),
        new Country("DM", "Dominica", "NA"),
        new Country("DO", "Dominican Republic", "NA"),
        new Country("SV", "El Salvador", "NA"),
        new Country("GD", "Grenada", "NA"),
        new Country("GT", "Guatemala", "NA"),
        new Country("HT", "Haiti", "NA"),
        new Country("HN", "Honduras", "NA"),
        new Country("JM", "Jamaica", "NA"),
        new Country("MX", "Mexico", "NA"),
        new Country("NI", "Nicaragua", "NA"),
        new Country("PA", "Panama", "NA"),
        new Country("KN", "Saint Kitts and Nevis", "NA"),
        new Country("LC", "Saint Lucia", "NA"),
        new Country("VC", "Saint Vincent and the Grenadines", "NA"),
        new Country("TT", "Trinidad and Tobago", "NA"),
        new Country("US", "United States", "NA"),

        // South America (SA)
        new Country("AR", "Argentina", "SA"),
        new Country("BO", "Bolivia", "SA"),
        new Country("BR", "Brazil", "SA"),
        new Country("CL", "Chile", "SA"),
        new Country("CO", "Colombia", "SA"),
        new Country("EC", "Ecuador", "SA"),
        new Country("GY", "Guyana", "SA"),
        new Country("PY", "Paraguay", "SA"),
        new Country("PE", "Peru", "SA"),
        new Country("SR", "Suriname", "SA"),
        new Country("UY", "Uruguay", "SA"),
        new Country("VE", "Venezuela", "SA"),

        // Oceania (OC)
        new Country("AU", "Australia", "OC"),
        new Country("FJ", "Fiji", "OC"),
        new Country("KI", "Kiribati", "OC"),
        new Country("MH", "Marshall Islands", "OC"),
        new Country("FM", "Micronesia", "OC"),
        new Country("NR", "Nauru", "OC"),
        new Country("NZ", "New Zealand", "OC"),
        new Country("PW", "Palau", "OC"),
        new Country("PG", "Papua New Guinea", "OC"),
        new Country("WS", "Samoa", "OC"),
        new Country("SB", "Solomon Islands", "OC"),
        new Country("TO", "Tonga", "OC"),
        new Country("TV", "Tuvalu", "OC"),
        new Country("VU", "Vanuatu", "OC")
    );

    // US states (used when mapType=COUNTRY and regionCode=US)
    private static final List<Country> US_STATES = List.of(
        new Country("US-AL", "Alabama", "US"),
        new Country("US-AK", "Alaska", "US"),
        new Country("US-AZ", "Arizona", "US"),
        new Country("US-AR", "Arkansas", "US"),
        new Country("US-CA", "California", "US"),
        new Country("US-CO", "Colorado", "US"),
        new Country("US-CT", "Connecticut", "US"),
        new Country("US-DE", "Delaware", "US"),
        new Country("US-FL", "Florida", "US"),
        new Country("US-GA", "Georgia", "US"),
        new Country("US-HI", "Hawaii", "US"),
        new Country("US-ID", "Idaho", "US"),
        new Country("US-IL", "Illinois", "US"),
        new Country("US-IN", "Indiana", "US"),
        new Country("US-IA", "Iowa", "US"),
        new Country("US-KS", "Kansas", "US"),
        new Country("US-KY", "Kentucky", "US"),
        new Country("US-LA", "Louisiana", "US"),
        new Country("US-ME", "Maine", "US"),
        new Country("US-MD", "Maryland", "US"),
        new Country("US-MA", "Massachusetts", "US"),
        new Country("US-MI", "Michigan", "US"),
        new Country("US-MN", "Minnesota", "US"),
        new Country("US-MS", "Mississippi", "US"),
        new Country("US-MO", "Missouri", "US"),
        new Country("US-MT", "Montana", "US"),
        new Country("US-NE", "Nebraska", "US"),
        new Country("US-NV", "Nevada", "US"),
        new Country("US-NH", "New Hampshire", "US"),
        new Country("US-NJ", "New Jersey", "US"),
        new Country("US-NM", "New Mexico", "US"),
        new Country("US-NY", "New York", "US"),
        new Country("US-NC", "North Carolina", "US"),
        new Country("US-ND", "North Dakota", "US"),
        new Country("US-OH", "Ohio", "US"),
        new Country("US-OK", "Oklahoma", "US"),
        new Country("US-OR", "Oregon", "US"),
        new Country("US-PA", "Pennsylvania", "US"),
        new Country("US-RI", "Rhode Island", "US"),
        new Country("US-SC", "South Carolina", "US"),
        new Country("US-SD", "South Dakota", "US"),
        new Country("US-TN", "Tennessee", "US"),
        new Country("US-TX", "Texas", "US"),
        new Country("US-UT", "Utah", "US"),
        new Country("US-VT", "Vermont", "US"),
        new Country("US-VA", "Virginia", "US"),
        new Country("US-WA", "Washington", "US"),
        new Country("US-WV", "West Virginia", "US"),
        new Country("US-WI", "Wisconsin", "US"),
        new Country("US-WY", "Wyoming", "US")
    );

    // India states + Union Territories (names match jbrobst GeoJSON ST_NM property)
    private static final List<Country> INDIA_STATES = List.of(
        // 28 States
        new Country("IN-AP", "Andhra Pradesh", "IN"),
        new Country("IN-AR", "Arunachal Pradesh", "IN"),
        new Country("IN-AS", "Assam", "IN"),
        new Country("IN-BR", "Bihar", "IN"),
        new Country("IN-CT", "Chhattisgarh", "IN"),
        new Country("IN-GA", "Goa", "IN"),
        new Country("IN-GJ", "Gujarat", "IN"),
        new Country("IN-HR", "Haryana", "IN"),
        new Country("IN-HP", "Himachal Pradesh", "IN"),
        new Country("IN-JH", "Jharkhand", "IN"),
        new Country("IN-KA", "Karnataka", "IN"),
        new Country("IN-KL", "Kerala", "IN"),
        new Country("IN-MP", "Madhya Pradesh", "IN"),
        new Country("IN-MH", "Maharashtra", "IN"),
        new Country("IN-MN", "Manipur", "IN"),
        new Country("IN-ML", "Meghalaya", "IN"),
        new Country("IN-MZ", "Mizoram", "IN"),
        new Country("IN-NL", "Nagaland", "IN"),
        new Country("IN-OR", "Odisha", "IN"),
        new Country("IN-PB", "Punjab", "IN"),
        new Country("IN-RJ", "Rajasthan", "IN"),
        new Country("IN-SK", "Sikkim", "IN"),
        new Country("IN-TN", "Tamil Nadu", "IN"),
        new Country("IN-TG", "Telangana", "IN"),
        new Country("IN-TR", "Tripura", "IN"),
        new Country("IN-UP", "Uttar Pradesh", "IN"),
        new Country("IN-UT", "Uttarakhand", "IN"),
        new Country("IN-WB", "West Bengal", "IN"),
        // 8 Union Territories
        new Country("IN-AN", "Andaman & Nicobar Island", "IN"),
        new Country("IN-CH", "Chandigarh", "IN"),
        new Country("IN-DH", "Dadra and Nagar Haveli", "IN"),
        new Country("IN-DD", "Daman & Diu", "IN"),
        new Country("IN-DL", "Delhi", "IN"),
        new Country("IN-JK", "Jammu & Kashmir", "IN"),
        new Country("IN-LA", "Ladakh", "IN"),
        new Country("IN-LD", "Lakshadweep", "IN"),
        new Country("IN-PY", "Puducherry", "IN")
    );

    private static final Map<String, String> WORLD_CAPITALS_MAP = Map.ofEntries(
        // Africa
        Map.entry("DZ", "Algiers"), Map.entry("AO", "Luanda"), Map.entry("BJ", "Porto-Novo"),
        Map.entry("BW", "Gaborone"), Map.entry("BF", "Ouagadougou"), Map.entry("BI", "Gitega"),
        Map.entry("CV", "Praia"), Map.entry("CM", "Yaoundé"), Map.entry("CF", "Bangui"),
        Map.entry("TD", "N'Djamena"), Map.entry("KM", "Moroni"), Map.entry("CG", "Brazzaville"),
        Map.entry("CD", "Kinshasa"), Map.entry("DJ", "Djibouti"), Map.entry("EG", "Cairo"),
        Map.entry("GQ", "Malabo"), Map.entry("ER", "Asmara"), Map.entry("SZ", "Mbabane"),
        Map.entry("ET", "Addis Ababa"), Map.entry("GA", "Libreville"), Map.entry("GM", "Banjul"),
        Map.entry("GH", "Accra"), Map.entry("GN", "Conakry"), Map.entry("GW", "Bissau"),
        Map.entry("CI", "Yamoussoukro"), Map.entry("KE", "Nairobi"), Map.entry("LS", "Maseru"),
        Map.entry("LR", "Monrovia"), Map.entry("LY", "Tripoli"), Map.entry("MG", "Antananarivo"),
        Map.entry("MW", "Lilongwe"), Map.entry("ML", "Bamako"), Map.entry("MR", "Nouakchott"),
        Map.entry("MU", "Port Louis"), Map.entry("MA", "Rabat"), Map.entry("MZ", "Maputo"),
        Map.entry("NA", "Windhoek"), Map.entry("NE", "Niamey"), Map.entry("NG", "Abuja"),
        Map.entry("RW", "Kigali"), Map.entry("ST", "São Tomé"), Map.entry("SN", "Dakar"),
        Map.entry("SC", "Victoria"), Map.entry("SL", "Freetown"), Map.entry("SO", "Mogadishu"),
        Map.entry("ZA", "Pretoria"), Map.entry("SS", "Juba"), Map.entry("SD", "Khartoum"),
        Map.entry("TZ", "Dodoma"), Map.entry("TG", "Lomé"), Map.entry("TN", "Tunis"),
        Map.entry("UG", "Kampala"), Map.entry("ZM", "Lusaka"), Map.entry("ZW", "Harare"),
        // Asia
        Map.entry("AF", "Kabul"), Map.entry("AM", "Yerevan"), Map.entry("AZ", "Baku"),
        Map.entry("BH", "Manama"), Map.entry("BD", "Dhaka"), Map.entry("BT", "Thimphu"),
        Map.entry("BN", "Bandar Seri Begawan"), Map.entry("KH", "Phnom Penh"),
        Map.entry("CN", "Beijing"), Map.entry("CY", "Nicosia"), Map.entry("GE", "Tbilisi"),
        Map.entry("IN", "New Delhi"), Map.entry("ID", "Jakarta"), Map.entry("IR", "Tehran"),
        Map.entry("IQ", "Baghdad"), Map.entry("IL", "Jerusalem"), Map.entry("JP", "Tokyo"),
        Map.entry("JO", "Amman"), Map.entry("KZ", "Astana"), Map.entry("KW", "Kuwait City"),
        Map.entry("KG", "Bishkek"), Map.entry("LA", "Vientiane"), Map.entry("LB", "Beirut"),
        Map.entry("MY", "Kuala Lumpur"), Map.entry("MV", "Malé"), Map.entry("MN", "Ulaanbaatar"),
        Map.entry("MM", "Naypyidaw"), Map.entry("NP", "Kathmandu"), Map.entry("KP", "Pyongyang"),
        Map.entry("OM", "Muscat"), Map.entry("PK", "Islamabad"), Map.entry("PS", "Ramallah"),
        Map.entry("PH", "Manila"), Map.entry("QA", "Doha"), Map.entry("SA", "Riyadh"),
        Map.entry("SG", "Singapore"), Map.entry("KR", "Seoul"), Map.entry("LK", "Kotte"),
        Map.entry("SY", "Damascus"), Map.entry("TW", "Taipei"), Map.entry("TJ", "Dushanbe"),
        Map.entry("TH", "Bangkok"), Map.entry("TL", "Dili"), Map.entry("TR", "Ankara"),
        Map.entry("TM", "Ashgabat"), Map.entry("AE", "Abu Dhabi"), Map.entry("UZ", "Tashkent"),
        Map.entry("VN", "Hanoi"), Map.entry("YE", "Sana'a"),
        // Europe
        Map.entry("AL", "Tirana"), Map.entry("AD", "Andorra la Vella"), Map.entry("AT", "Vienna"),
        Map.entry("BY", "Minsk"), Map.entry("BE", "Brussels"), Map.entry("BA", "Sarajevo"),
        Map.entry("BG", "Sofia"), Map.entry("HR", "Zagreb"), Map.entry("CZ", "Prague"),
        Map.entry("DK", "Copenhagen"), Map.entry("EE", "Tallinn"), Map.entry("FI", "Helsinki"),
        Map.entry("FR", "Paris"), Map.entry("DE", "Berlin"), Map.entry("GR", "Athens"),
        Map.entry("HU", "Budapest"), Map.entry("IS", "Reykjavik"), Map.entry("IE", "Dublin"),
        Map.entry("IT", "Rome"), Map.entry("XK", "Pristina"), Map.entry("LV", "Riga"),
        Map.entry("LI", "Vaduz"), Map.entry("LT", "Vilnius"), Map.entry("LU", "Luxembourg City"),
        Map.entry("MT", "Valletta"), Map.entry("MD", "Chișinău"), Map.entry("MC", "Monaco"),
        Map.entry("ME", "Podgorica"), Map.entry("NL", "Amsterdam"), Map.entry("MK", "Skopje"),
        Map.entry("NO", "Oslo"), Map.entry("PL", "Warsaw"), Map.entry("PT", "Lisbon"),
        Map.entry("RO", "Bucharest"), Map.entry("RU", "Moscow"), Map.entry("SM", "San Marino"),
        Map.entry("RS", "Belgrade"), Map.entry("SK", "Bratislava"), Map.entry("SI", "Ljubljana"),
        Map.entry("ES", "Madrid"), Map.entry("SE", "Stockholm"), Map.entry("CH", "Bern"),
        Map.entry("UA", "Kyiv"), Map.entry("GB", "London"), Map.entry("VA", "Vatican City"),
        // North America
        Map.entry("AG", "Saint John's"), Map.entry("BS", "Nassau"), Map.entry("BB", "Bridgetown"),
        Map.entry("BZ", "Belmopan"), Map.entry("CA", "Ottawa"), Map.entry("CR", "San José"),
        Map.entry("CU", "Havana"), Map.entry("DM", "Roseau"), Map.entry("DO", "Santo Domingo"),
        Map.entry("SV", "San Salvador"), Map.entry("GD", "St. George's"),
        Map.entry("GT", "Guatemala City"), Map.entry("HT", "Port-au-Prince"),
        Map.entry("HN", "Tegucigalpa"), Map.entry("JM", "Kingston"),
        Map.entry("MX", "Mexico City"), Map.entry("NI", "Managua"),
        Map.entry("PA", "Panama City"), Map.entry("KN", "Basseterre"),
        Map.entry("LC", "Castries"), Map.entry("VC", "Kingstown"),
        Map.entry("TT", "Port of Spain"), Map.entry("US", "Washington D.C."),
        // South America
        Map.entry("AR", "Buenos Aires"), Map.entry("BO", "Sucre"), Map.entry("BR", "Brasília"),
        Map.entry("CL", "Santiago"), Map.entry("CO", "Bogotá"), Map.entry("EC", "Quito"),
        Map.entry("GY", "Georgetown"), Map.entry("PY", "Asunción"), Map.entry("PE", "Lima"),
        Map.entry("SR", "Paramaribo"), Map.entry("UY", "Montevideo"), Map.entry("VE", "Caracas"),
        // Oceania
        Map.entry("AU", "Canberra"), Map.entry("FJ", "Suva"), Map.entry("KI", "South Tarawa"),
        Map.entry("MH", "Majuro"), Map.entry("FM", "Palikir"), Map.entry("NR", "Yaren"),
        Map.entry("NZ", "Wellington"), Map.entry("PW", "Ngerulmud"),
        Map.entry("PG", "Port Moresby"), Map.entry("WS", "Apia"), Map.entry("SB", "Honiara"),
        Map.entry("TO", "Nukualofa"), Map.entry("TV", "Funafuti"), Map.entry("VU", "Port Vila")
    );

    private static final Map<String, String> INDIA_CAPITALS_MAP = Map.ofEntries(
        Map.entry("IN-AP", "Amaravati"), Map.entry("IN-AR", "Itanagar"),
        Map.entry("IN-AS", "Dispur"), Map.entry("IN-BR", "Patna"),
        Map.entry("IN-CT", "Raipur"), Map.entry("IN-GA", "Panaji"),
        Map.entry("IN-GJ", "Gandhinagar"), Map.entry("IN-HR", "Chandigarh"),
        Map.entry("IN-HP", "Shimla"), Map.entry("IN-JH", "Ranchi"),
        Map.entry("IN-KA", "Bengaluru"), Map.entry("IN-KL", "Thiruvananthapuram"),
        Map.entry("IN-MP", "Bhopal"), Map.entry("IN-MH", "Mumbai"),
        Map.entry("IN-MN", "Imphal"), Map.entry("IN-ML", "Shillong"),
        Map.entry("IN-MZ", "Aizawl"), Map.entry("IN-NL", "Kohima"),
        Map.entry("IN-OR", "Bhubaneswar"), Map.entry("IN-PB", "Chandigarh"),
        Map.entry("IN-RJ", "Jaipur"), Map.entry("IN-SK", "Gangtok"),
        Map.entry("IN-TN", "Chennai"), Map.entry("IN-TG", "Hyderabad"),
        Map.entry("IN-TR", "Agartala"), Map.entry("IN-UP", "Lucknow"),
        Map.entry("IN-UT", "Dehradun"), Map.entry("IN-WB", "Kolkata"),
        Map.entry("IN-AN", "Port Blair"), Map.entry("IN-CH", "Chandigarh"),
        Map.entry("IN-DH", "Silvassa"), Map.entry("IN-DD", "Daman"),
        Map.entry("IN-DL", "New Delhi"), Map.entry("IN-JK", "Srinagar"),
        Map.entry("IN-LA", "Leh"), Map.entry("IN-LD", "Kavaratti"),
        Map.entry("IN-PY", "Puducherry")
    );

    public List<Country> getCountriesForMapType(MapType mapType, String regionCode) {
        List<Country> result = switch (mapType) {
            case WORLD -> new ArrayList<>(ALL_COUNTRIES);
            case AFRICA -> ALL_COUNTRIES.stream()
                    .filter(c -> "AF".equals(c.continent()))
                    .collect(Collectors.toList());
            case ASIA -> ALL_COUNTRIES.stream()
                    .filter(c -> "AS".equals(c.continent()))
                    .collect(Collectors.toList());
            case EUROPE -> ALL_COUNTRIES.stream()
                    .filter(c -> "EU".equals(c.continent()))
                    .collect(Collectors.toList());
            case AMERICAS -> ALL_COUNTRIES.stream()
                    .filter(c -> "NA".equals(c.continent()) || "SA".equals(c.continent()))
                    .collect(Collectors.toList());
            case OCEANIA -> ALL_COUNTRIES.stream()
                    .filter(c -> "OC".equals(c.continent()))
                    .collect(Collectors.toList());
            case INDIA_STATES -> new ArrayList<>(INDIA_STATES);
            case WORLD_CAPITALS -> ALL_COUNTRIES.stream()
                    .map(c -> new Country(c.code(), WORLD_CAPITALS_MAP.getOrDefault(c.code(), c.name()), c.continent()))
                    .collect(Collectors.toList());
            case INDIA_CAPITALS -> INDIA_STATES.stream()
                    .map(c -> new Country(c.code(), INDIA_CAPITALS_MAP.getOrDefault(c.code(), c.name()), c.continent()))
                    .collect(Collectors.toList());
        };

        Collections.shuffle(result);
        return result;
    }

    private List<Country> getSubdivisions(String regionCode) {
        if (regionCode == null) {
            return new ArrayList<>(US_STATES);
        }
        return switch (regionCode.toUpperCase()) {
            case "US" -> new ArrayList<>(US_STATES);
            case "IN" -> new ArrayList<>(INDIA_STATES);
            default -> new ArrayList<>(US_STATES);
        };
    }

    public Country findCountryByCode(String code) {
        if (code == null) return null;
        return Stream.concat(ALL_COUNTRIES.stream(), INDIA_STATES.stream())
                .filter(c -> c.code().equalsIgnoreCase(code))
                .findFirst()
                .orElse(null);
    }

    public boolean isValidCode(String code, MapType mapType) {
        if (code == null) return false;
        List<Country> pool = switch (mapType) {
            case WORLD_CAPITALS -> ALL_COUNTRIES;
            case INDIA_CAPITALS -> INDIA_STATES;
            default -> Stream.concat(ALL_COUNTRIES.stream(), INDIA_STATES.stream()).toList();
        };
        return pool.stream().anyMatch(c -> c.code().equalsIgnoreCase(code));
    }
}
