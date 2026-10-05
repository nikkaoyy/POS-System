package com.fis.pos.security;

import com.fis.pos.api.ApiModels.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {
    public static final String USER_ATTRIBUTE = "authenticatedUser";
    private final SessionStore sessions;

    public AuthInterceptor(SessionStore sessions) {
        this.sessions = sessions;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        if (path.equals("/api/auth/login") || path.equals("/api/auth/logout")
            || request.getMethod().equals("OPTIONS")) {
            return true;
        }
        String header = request.getHeader("Authorization");
        String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
        UserResponse user = sessions.find(token);
        if (user == null) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return false;
        }
        request.setAttribute(USER_ATTRIBUTE, user);
        return true;
    }
}
