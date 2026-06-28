package com.geomaster.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;

@Service
public class KeepAliveService {

    @Value("${github.pat:}")
    private String githubPat;

    @Value("${github.repo:}")
    private String githubRepo;

    /**
     * Fire-and-forget: tells GitHub to set KEEP_ALIVE=true so the
     * Actions cron knows to keep pinging Render.
     */
    public void signalActivity() {
        if (githubPat.isBlank() || githubRepo.isBlank()) return;
        CompletableFuture.runAsync(() -> {
            try {
                HttpClient client = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(5))
                        .build();
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.github.com/repos/" + githubRepo + "/actions/variables/KEEP_ALIVE"))
                        .header("Authorization", "Bearer " + githubPat)
                        .header("Accept", "application/vnd.github+json")
                        .header("X-GitHub-Api-Version", "2022-11-28")
                        .header("Content-Type", "application/json")
                        .method("PATCH", HttpRequest.BodyPublishers.ofString("{\"value\":\"true\"}"))
                        .timeout(Duration.ofSeconds(8))
                        .build();
                client.send(req, HttpResponse.BodyHandlers.discarding());
            } catch (Exception ignored) {
                // non-critical, don't fail the game session
            }
        });
    }
}
