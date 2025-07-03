package com.flexfit.userservice.service;

import com.flexfit.userservice.dto.AuthResponse;
import com.flexfit.userservice.dto.LoginRequest;
import com.flexfit.userservice.dto.UserResponse;
import com.flexfit.userservice.models.User;
import com.flexfit.userservice.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    @Value("${flexfit.jwt.secret:your-256-bit-secret-key-change-in-production-must-be-at-least-32-chars}")
    private String jwtSecret;

    @Value("${flexfit.jwt.expiration:86400}") // 24 hours in seconds
    private int jwtExpirationInSeconds;

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());
        
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userOpt.get();
        
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = generateJwtToken(user);
        UserResponse userResponse = userService.getUserById(user.getId()).orElseThrow();

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(userResponse)
                .message("Login successful")
                .build();
    }

    @Override
    public AuthResponse registerAndLogin(String email, String password) {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword(password);
        return login(loginRequest);
    }

    private String generateJwtToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plus(jwtExpirationInSeconds, ChronoUnit.SECONDS);
        
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId().toString())
                .claim("username", user.getUsername())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
} 