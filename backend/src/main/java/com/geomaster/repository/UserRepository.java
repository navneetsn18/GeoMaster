package com.geomaster.repository;

import com.geomaster.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    long countByBanned(boolean banned);

    /**
     * Returns the friend IDs for a given user (the IDs of users that userId has added as friends).
     */
    @Query("SELECT f.friendId FROM Friendship f WHERE f.userId = :userId")
    List<String> findFriendIdsByUserId(@Param("userId") String userId);
}
