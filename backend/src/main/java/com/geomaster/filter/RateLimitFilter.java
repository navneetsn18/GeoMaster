package com.geomaster.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    // ip:bucket -> sliding window of timestamps (ms)
    private final ConcurrentHashMap<String, Deque<Long>> windows = new ConcurrentHashMap<>();

    // Bucket configs: [maxRequests, windowSeconds]
    private static final int[] AUTH_LOGIN    = {5,   60};   // 5 req / min
    private static final int[] AUTH_REGISTER = {3,   300};  // 3 req / 5 min
    private static final int[] AUTH_GENERAL  = {15,  60};   // 15 req / min
    private static final int[] API_GENERAL   = {300, 60};   // 300 req / min

    public RateLimitFilter() {
        // Periodic cleanup every 5 min to prevent unbounded growth
        Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "rate-limit-cleaner");
            t.setDaemon(true);
            return t;
        }).scheduleAtFixedRate(this::cleanup, 5, 5, TimeUnit.MINUTES);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {

        String ip = resolveClientIp(req);
        String path = req.getRequestURI();
        String method = req.getMethod();

        int[] limits = resolveLimits(method, path);
        int maxRequests = limits[0];
        int windowSeconds = limits[1];
        String bucketKey = ip + ":" + bucketName(method, path);

        if (!isAllowed(bucketKey, maxRequests, windowSeconds)) {
            log.warn("Rate limit exceeded: ip={} path={}", ip, path);
            res.setStatus(429);
            res.setContentType(MediaType.APPLICATION_JSON_VALUE);
            res.getWriter().write("{\"error\":\"Too many requests. Please slow down and try again.\"}");
            return;
        }

        chain.doFilter(req, res);
    }

    private boolean isAllowed(String key, int maxRequests, int windowSeconds) {
        long now = System.currentTimeMillis();
        long cutoff = now - (windowSeconds * 1000L);

        Deque<Long> deque = windows.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            // Remove timestamps outside window
            while (!deque.isEmpty() && deque.peekFirst() < cutoff) {
                deque.pollFirst();
            }
            if (deque.size() >= maxRequests) return false;
            deque.addLast(now);
            return true;
        }
    }

    private void cleanup() {
        long cutoff = System.currentTimeMillis() - 600_000; // 10 min
        windows.forEach((key, deque) -> {
            synchronized (deque) {
                while (!deque.isEmpty() && deque.peekFirst() < cutoff) deque.pollFirst();
            }
            if (deque.isEmpty()) windows.remove(key);
        });
    }

    private int[] resolveLimits(String method, String path) {
        if (path.contains("/api/auth/login"))    return AUTH_LOGIN;
        if (path.contains("/api/auth/register")) return AUTH_REGISTER;
        if (path.contains("/api/auth/"))         return AUTH_GENERAL;
        return API_GENERAL;
    }

    private String bucketName(String method, String path) {
        if (path.contains("/api/auth/login"))    return "login";
        if (path.contains("/api/auth/register")) return "register";
        if (path.contains("/api/auth/"))         return "auth";
        return "api";
    }

    /** Respect X-Forwarded-For for Render/Vercel reverse proxies */
    private String resolveClientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String realIp = req.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp;
        return req.getRemoteAddr();
    }
}
