package com.geomaster.repository;

import com.geomaster.model.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, String> {

    boolean existsByUserIdAndFriendId(String userId, String friendId);

    void deleteByUserIdAndFriendId(String userId, String friendId);

    @Query("SELECT f.friendId FROM Friendship f WHERE f.userId = :userId")
    List<String> findFriendIdsByUserId(@Param("userId") String userId);
}
