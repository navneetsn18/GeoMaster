package com.geomaster.util;

import java.util.Set;

/**
 * Checks usernames and email local-parts for blocked words.
 * Normalises leet-speak before matching so simple bypasses don't work.
 */
public final class ProfanityFilter {

    private ProfanityFilter() {}

    // ── Blocked word list ────────────────────────────────────────────────────
    // English + romanised Hindi/Indian profanity
    private static final Set<String> BLOCKED = Set.of(
        // English — common
        "fuck", "fucker", "fucks", "fucking", "fucked", "fuckoff", "fucku",
        "shit", "shits", "shitting", "shithead", "bullshit",
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
        "twat",
        "bollocks",
        "arse",
        "damn", "damnit",
        "crap",
        "porn", "porno",
        "sex", "sexy", "sexxx",
        "nude", "nudes",
        "rape", "raping", "rapist",
        "kill", "killing", "killer",
        "murder", "murderer",
        "terrorist", "terror",
        "nazi", "hitler",
        // Abbreviations
        "wtf", "stfu", "gtfo",

        // Romanised Hindi / Indian
        "madarchod", "madarc", "maderchod",
        "bhenchod", "bhenc", "benchod",
        "chutiya", "chutiye", "chutiyo",
        "bhosdike", "bhosdiwale",
        "gandu", "gand",
        "lodu", "lode", "lauda", "lavda",
        "randi", "randwa",
        "harami", "haramzada", "haramzaade",
        "saala", "saali",
        "kameena", "kameeni",
        "maderchod",
        "teri", "teri maa",
        "gaand",
        "chut",
        "tatti",
        "haram",
        "kutte", "kutta",
        "suar",
        "bakwas",
        // Common short-form abuses used online
        "mc", "bc", "mf", "mfker"
    );

    // ── Public API ───────────────────────────────────────────────────────────

    /**
     * Returns true if text contains any blocked word.
     * Checks both original (lowercased) and leet-normalised forms.
     */
    public static boolean containsProfanity(String text) {
        if (text == null || text.isBlank()) return false;
        String lower = text.toLowerCase();
        String normalised = normaliseLeet(lower);
        for (String word : BLOCKED) {
            if (lower.contains(word) || normalised.contains(word)) {
                return true;
            }
        }
        return false;
    }

    /** Check username — strips non-alphanumeric before matching */
    public static boolean isUsernameBlocked(String username) {
        if (username == null) return false;
        // Also check with underscores/dots stripped
        String stripped = username.replaceAll("[^a-zA-Z0-9]", "");
        return containsProfanity(username) || containsProfanity(stripped);
    }

    /** Check email — only test local part (before @) */
    public static boolean isEmailBlocked(String email) {
        if (email == null || !email.contains("@")) return false;
        String localPart = email.substring(0, email.indexOf('@'));
        return containsProfanity(localPart);
    }

    // ── Leet normalisation ───────────────────────────────────────────────────
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
