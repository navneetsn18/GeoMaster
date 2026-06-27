package com.geomaster.util;

import java.util.Set;

/**
 * Checks usernames and email local-parts for blocked words.
 * Uses token-based matching (split by non-alpha separators) to prevent false
 * positives from innocent words that happen to contain short profanity substrings
 * (e.g. "class" must not match "ass", "skill" must not match "kill").
 * Also normalises leet-speak before matching.
 */
public final class ProfanityFilter {

    private ProfanityFilter() {}

    private static final Set<String> BLOCKED = Set.of(
        // English — unambiguous profanity
        "fuck", "fucker", "fucks", "fucking", "fucked", "fuckoff", "fucku", "fuckface",
        "shit", "shits", "shitting", "shithead", "bullshit", "shitstain",
        "ass", "asses", "asshole", "asswipe", "jackass", "dumbass", "smartass",
        "bitch", "bitches", "bitching",
        "cock", "cocks", "cockhead", "cocksuck",
        "dick", "dicks", "dickhead", "dickface",
        "pussy", "pussies",
        "cunt", "cunts",
        "whore", "whores",
        "slut", "sluts",
        "bastard", "bastards",
        "nigger", "nigga",
        "faggot", "fag",
        "retard", "retarded",
        "piss", "pissing", "pissoff",
        "wank", "wanker",
        "twat", "bollocks", "arse",
        "porn", "porno",
        "rape", "raping", "rapist",
        "nazi", "hitler",
        "wtf", "stfu", "gtfo",

        // Romanised Hindi / Indian
        "madarchod", "madarc", "maderchod",
        "bhenchod", "bhenc", "benchod",
        "chutiya", "chutiye", "chutiyo",
        "bhosdike", "bhosdiwale",
        "gandu", "gaand",
        "lodu", "lode", "lauda", "lavda",
        "randi", "randwa",
        "harami", "haramzada", "haramzaade",
        "kameena", "kameeni",
        "chut",
        "tatti",
        "kutte", "kutta",
        "mfker"
    );

    // ── Public API ───────────────────────────────────────────────────────────

    /**
     * Check username. Splits by non-alpha separators and checks each token
     * for exact match, prefix, or suffix of a blocked word. This prevents
     * "class" from matching "ass" while still catching "fuckyou", "asshole_42".
     */
    public static boolean isUsernameBlocked(String username) {
        if (username == null || username.isBlank()) return false;
        return isTokenBlocked(username.toLowerCase()) ||
               isTokenBlocked(normaliseLeet(username.toLowerCase()));
    }

    /** Check email — only tests local part (before @). */
    public static boolean isEmailBlocked(String email) {
        if (email == null || !email.contains("@")) return false;
        String localPart = email.substring(0, email.indexOf('@')).toLowerCase();
        return isTokenBlocked(localPart) || isTokenBlocked(normaliseLeet(localPart));
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    /**
     * Splits text into alpha-only tokens, then checks each token:
     * 1. Exact match with a blocked word
     * 2. Token starts with a blocked word (catches "fuckyou", "shithead42")
     * 3. Token ends with a blocked word (catches "yourass", "bigcock")
     */
    private static boolean isTokenBlocked(String text) {
        if (text == null || text.isBlank()) return false;
        for (String token : text.split("[^a-z]+")) {
            if (token.isEmpty()) continue;
            if (BLOCKED.contains(token)) return true;
            for (String word : BLOCKED) {
                if (token.length() > word.length()) {
                    if (token.startsWith(word) || token.endsWith(word)) return true;
                }
            }
        }
        return false;
    }

    private static String normaliseLeet(String s) {
        return s
            .replace("0", "o")
            .replace("1", "i")
            .replace("3", "e")
            .replace("4", "a")
            .replace("5", "s")
            .replace("6", "g")
            .replace("7", "t")
            .replace("8", "b")
            .replace("9", "g")
            .replace("@", "a")
            .replace("$", "s")
            .replace("+", "t")
            .replace("!", "i");
    }
}
