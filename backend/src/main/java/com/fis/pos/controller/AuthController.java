package com.fis.pos.controller;

import com.fis.pos.api.ApiModels;
import com.fis.pos.security.AuthInterceptor;
import com.fis.pos.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public ApiModels.LoginResponse login(@Valid @RequestBody ApiModels.LoginRequest request) {
        return service.login(request.pin());
    }

    @GetMapping("/me")
    public ApiModels.UserResponse me(@RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) ApiModels.UserResponse user) {
        return user;
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        service.logout(authorization);
        return ResponseEntity.noContent().build();
    }
}
