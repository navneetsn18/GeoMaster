package com.geomaster.service;

import com.geomaster.dto.request.GuessRequest;
import com.geomaster.dto.request.StartSessionRequest;
import com.geomaster.dto.response.GameCompleteDto;
import com.geomaster.dto.response.GameSessionDto;
import com.geomaster.dto.response.GuessResultDto;
import com.geomaster.model.GameSession;
import com.geomaster.model.GuessRecord;
import com.geomaster.model.User;
import com.geomaster.exception.ForbiddenException;
import com.geomaster.exception.SessionAlreadyCompletedException;
import com.geomaster.exception.SessionNotFoundException;
import com.geomaster.repository.GameSessionRepository;
import com.geomaster.repository.GuessRecordRepository;
import com.geomaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameService {

    private final GameSessionRepository gameSessionRepository;
    private final GuessRecordRepository guessRecordRepository;
    private final UserRepository userRepository;
    private final CountryDataService countryDataService;

    @Transactional
    public GameSessionDto startSession(String userEmail, StartSessionRequest request) {
        User user = findUser(userEmail);

        GameSession session = GameSession.builder()
                .userId(user.getId())
                .mapType(request.getMapType().name())
                .regionCode(request.getRegionCode())
                .build();

        session = gameSessionRepository.save(session);

        List<CountryDataService.Country> countries =
                countryDataService.getCountriesForMapType(request.getMapType(), request.getRegionCode());

        List<GameSessionDto.CountryDto> countryDtos = countries.stream()
                .map(c -> GameSessionDto.CountryDto.builder()
                        .code(c.code().toLowerCase())
                        .name(c.name())
                        .flagUrl(c.flagUrl())
                        .build())
                .collect(Collectors.toList());

        return GameSessionDto.builder()
                .sessionId(session.getId())
                .mapType(session.getMapType())
                .regionCode(session.getRegionCode())
                .countries(countryDtos)
                .totalCountries(countryDtos.size())
                .build();
    }

    @Transactional
    public GuessResultDto submitGuess(String userEmail, UUID sessionId, GuessRequest request) {
        User user = findUser(userEmail);
        GameSession session = gameSessionRepository
                .findById(sessionId.toString())
                .orElseThrow(() -> new SessionNotFoundException(sessionId.toString()));

        if (!session.getUserId().equals(user.getId())) {
            throw new ForbiddenException("You do not have permission to access this session");
        }

        if (!"IN_PROGRESS".equals(session.getStatus())) {
            throw new IllegalStateException("Session is not in progress");
        }

        boolean correct = Boolean.TRUE.equals(request.getIsCorrect());
        int newStreak = correct ? session.getCurrentStreak() + 1 : 0;
        int points = calculatePoints(correct, request.getTimeTakenMs(), session.getCurrentStreak());

        int basePoints = correct ? calculateBasePoints(request.getTimeTakenMs()) : 0;
        int streakBonus = Math.max(0, points - basePoints);

        session.setFinalScore(session.getFinalScore() + points);
        session.setTotalCount(session.getTotalCount() + 1);
        if (correct) {
            session.setCorrectCount(session.getCorrectCount() + 1);
        }
        session.setCurrentStreak(newStreak);
        if (newStreak > session.getBestStreak()) {
            session.setBestStreak(newStreak);
        }

        gameSessionRepository.save(session);

        GuessRecord record = GuessRecord.builder()
                .sessionId(session.getId())
                .countryCode(request.getCountryCode())
                .correct(correct)
                .timeTakenMs(request.getTimeTakenMs().intValue())
                .pointsEarned(points)
                .build();
        guessRecordRepository.save(record);

        return GuessResultDto.builder()
                .correct(correct)
                .pointsEarned(points)
                .streakBonus(streakBonus)
                .totalScore(session.getFinalScore())
                .currentStreak(session.getCurrentStreak())
                .bestStreak(session.getBestStreak())
                .build();
    }

    @Transactional
    public GameCompleteDto completeSession(String userEmail, UUID sessionId) {
        User user = findUser(userEmail);
        GameSession session = gameSessionRepository
                .findByIdAndUserId(sessionId.toString(), user.getId())
                .orElseThrow(() -> new SessionNotFoundException(sessionId.toString()));

        if (!"IN_PROGRESS".equals(session.getStatus())) {
            throw new SessionAlreadyCompletedException(sessionId.toString());
        }

        int previousBest = gameSessionRepository.findBestScoreByUserId(user.getId()).orElse(0);

        session.complete(); // sets status=COMPLETED and completedAt=Instant.now()
        gameSessionRepository.save(session);

        double accuracy = session.getTotalCount() > 0
                ? (double) session.getCorrectCount() / session.getTotalCount() * 100.0
                : 0.0;

        long timeTakenSec = session.getStartedAt() != null && session.getCompletedAt() != null
                ? ChronoUnit.SECONDS.between(session.getStartedAt(), session.getCompletedAt())
                : 0;

        return GameCompleteDto.builder()
                .sessionId(sessionId.toString())
                .score(session.getFinalScore())
                .correctCount(session.getCorrectCount())
                .totalCount(session.getTotalCount())
                .accuracy(accuracy)
                .timeTaken(timeTakenSec)
                .bestStreak(session.getBestStreak())
                .newPersonalBest(session.getFinalScore() > previousBest)
                .build();
    }

    /**
     * base=100, timeBonus=max(0, 50 - max(0, floor((ms-3000)/1000))),
     * multiplier: streak<5→1x, <10→1.5x, <20→2x, ≥20→3x. Wrong→0, streak reset.
     */
    public int calculatePoints(boolean isCorrect, long timeTakenMs, int currentStreak) {
        if (!isCorrect) return 0;
        int base = 100;
        long secondsElapsed = (timeTakenMs - 3000) / 1000;
        int timeBonus = (int) Math.max(0, 50 - Math.max(0, secondsElapsed));
        double multiplier = currentStreak >= 20 ? 3.0
                : currentStreak >= 10 ? 2.0
                : currentStreak >= 5 ? 1.5
                : 1.0;
        return (int) ((base + timeBonus) * multiplier);
    }

    private int calculateBasePoints(long timeTakenMs) {
        long secondsElapsed = (timeTakenMs - 3000) / 1000;
        int timeBonus = (int) Math.max(0, 50 - Math.max(0, secondsElapsed));
        return 100 + timeBonus;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
