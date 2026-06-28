package com.geomaster.repository;

import com.geomaster.model.UserSessionFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSessionFlagRepository extends JpaRepository<UserSessionFlag, String> {

    Optional<UserSessionFlag> findBySessionIdAndUserId(String sessionId, String userId);

    long countBySessionId(String sessionId);

    @Modifying
    @Query("DELETE FROM UserSessionFlag f WHERE f.sessionId = :sessionId AND f.userId = :userId")
    void deleteBySessionIdAndUserId(@Param("sessionId") String sessionId, @Param("userId") String userId);
}
