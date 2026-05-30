package com.texton.backend.repositories;

import com.texton.backend.models.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, String> {

    @Modifying
    @Query("DELETE FROM RevokedToken r WHERE r.expiresAt < :cutoff")
    int deleteExpired(Instant cutoff);
}
