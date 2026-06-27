package com.geomaster.repository;

import com.geomaster.model.GuessRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GuessRecordRepository extends JpaRepository<GuessRecord, String> {

    List<GuessRecord> findBySessionIdOrderByGuessedAtAsc(String sessionId);
}
