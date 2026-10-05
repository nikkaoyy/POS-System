package com.fis.pos.service;

import com.fis.pos.api.ApiModels;
import com.fis.pos.repository.PosRepository;
import com.fis.pos.security.SessionStore;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final PosRepository repository;
    private final SessionStore sessions;

    public AuthService(PosRepository repository, SessionStore sessions) {
        this.repository = repository;
        this.sessions = sessions;
    }

    public ApiModels.LoginResponse login(String pin) {
        ApiModels.UserResponse user = repository.findUserByPin(pin);
        if (user == null) throw new IllegalArgumentException("PIN inválido");
        return new ApiModels.LoginResponse(sessions.create(user), user);
    }

    public void logout(String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            sessions.remove(authorization.substring(7));
        }
    }
}
