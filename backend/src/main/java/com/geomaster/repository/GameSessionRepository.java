package com.geomaster.repository;

import com.geomaster.model.GameSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, String> {

    Page<GameSession> findByUserIdOrderByStartedAtDesc(String userId, Pageable pageable);

    /**
     * Returns completed sessions for a given map type, ordered by score descending.
     * If {@code since} is null all time is included (ALL_TIME); otherwise only sessions
     * completed after that instant are returned.
     */
    @Query("SELECT gs FROM GameSession gs WHERE gs.status = 'COMPLETED' AND gs.hidden = false AND gs.mapType = :mapType ORDER BY gs.finalScore DESC")
    List<GameSession> findCompletedByMapTypeAllTime(@Param("mapType") String mapType, Pageable pageable);

    @Query("SELECT gs FROM GameSession gs WHERE gs.status = 'COMPLETED' AND gs.hidden = false AND gs.mapType = :mapType AND gs.completedAt > :since ORDER BY gs.finalScore DESC")
    List<GameSession> findCompletedByMapTypeSince(@Param("mapType") String mapType, @Param("since") Instant since, Pageable pageable);

    @Query("SELECT gs FROM GameSession gs WHERE gs.status = 'COMPLETED' AND gs.hidden = false AND gs.userId IN :userIds AND gs.mapType = :mapType ORDER BY gs.finalScore DESC")
    List<GameSession> findCompletedByUserIdsAndMapTypeAllTime(@Param("userIds") List<String> userIds, @Param("mapType") String mapType, Pageable pageable);

    @Query("SELECT gs FROM GameSession gs WHERE gs.status = 'COMPLETED' AND gs.hidden = false AND gs.userId IN :userIds AND gs.mapType = :mapType AND gs.completedAt > :since ORDER BY gs.finalScore DESC")
    List<GameSession> findCompletedByUserIdsAndMapTypeSince(@Param("userIds") List<String> userIds, @Param("mapType") String mapType, @Param("since") Instant since, Pageable pageable);

    @Query("SELECT COUNT(gs) FROM GameSession gs WHERE gs.userId = :userId AND gs.flagCount > 0")
    long countFlaggedSessionsByUserId(@Param("userId") String userId);

    @jakarta.transaction.Transactional
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE GameSession gs SET gs.hidden = true WHERE gs.userId = :userId")
    void hideAllByUserId(@Param("userId") String userId);

    @jakarta.transaction.Transactional
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE GameSession gs SET gs.hidden = false WHERE gs.userId = :userId")
    void unhideAllByUserId(@Param("userId") String userId);

    @jakarta.transaction.Transactional
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE GameSession gs SET gs.flagCount = 0 WHERE gs.userId = :userId")
    void resetFlagsByUserId(@Param("userId") String userId);

    Optional<GameSession> findByIdAndUserId(String id, String userId);

    @Query("SELECT COUNT(gs) FROM GameSession gs WHERE gs.userId = :userId AND gs.status = 'COMPLETED'")
    long countCompletedByUserId(@Param("userId") String userId);

    @Query("SELECT AVG(CAST(gs.correctCount AS double) / NULLIF(gs.totalCount, 0)) FROM GameSession gs " +
           "WHERE gs.userId = :userId AND gs.status = 'COMPLETED' AND gs.totalCount > 0")
    Optional<Double> findAvgAccuracyByUserId(@Param("userId") String userId);

    @Query("SELECT MAX(gs.finalScore) FROM GameSession gs WHERE gs.userId = :userId AND gs.status = 'COMPLETED'")
    Optional<Integer> findBestScoreByUserId(@Param("userId") String userId);

    @Query("SELECT MAX(gs.bestStreak) FROM GameSession gs WHERE gs.userId = :userId AND gs.status = 'COMPLETED'")
    Optional<Integer> findBestStreakByUserId(@Param("userId") String userId);

    long countByStatus(String status);

    boolean existsByStartedAtAfter(Instant startedAt);

    void deleteByUserId(String userId);

    @Query(value = "SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (completed_at - started_at))), 0) " +
                   "FROM game_sessions WHERE status = 'COMPLETED' AND completed_at IS NOT NULL AND started_at IS NOT NULL",
           nativeQuery = true)
    double sumTimeTakenSeconds();
}
