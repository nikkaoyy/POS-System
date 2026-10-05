package com.fis.pos.security;

import com.fis.pos.api.ApiModels.UserResponse;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SessionStore {
    private static final Duration SESSION_TTL = Duration.ofHours(8);
    private final Map<String, Session> sessions = new ConcurrentHashMap<>();

    public String create(UserResponse user) {
        String token = UUID.randomUUID().toString();
        sessions.put(token, new Session(user, Instant.now().plus(SESSION_TTL)));
        return token;
    }

    public UserResponse find(String token) {
        Session session = token == null ? null : sessions.get(token);
        if (session == null || session.expiresAt().isBefore(Instant.now())) {
            if (token != null) sessions.remove(token);
            return null;
        }
        return session.user();
    }

    public void remove(String token) {
        if (token != null) sessions.remove(token);
    }

    private record Session(UserResponse user, Instant expiresAt) { }
}
