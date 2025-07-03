package com.flexfit.userservice.service;

import com.flexfit.userservice.dto.UserRegistrationRequest;
import com.flexfit.userservice.dto.UserResponse;
import com.flexfit.userservice.dto.UserPreferencesResponse;
import com.flexfit.userservice.models.User;
import com.flexfit.userservice.models.UserPreferences;
import com.flexfit.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserResponse registerUser(UserRegistrationRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalStateException("Username already exists");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());
        user.setHeightCm(request.getHeightCm());
        user.setWeightKg(request.getWeightKg());

        // Create empty preferences for the new user
        UserPreferences preferences = new UserPreferences();
        user.setPreferences(preferences);

        User savedUser = userRepository.save(user);
        return convertToUserResponse(savedUser);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<UserResponse> getUserByEmail(String email) {
        return userRepository.findByEmail(email).map(this::convertToUserResponse);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<UserResponse> getUserById(UUID id) {
        return userRepository.findById(id).map(this::convertToUserResponse);
    }

    private UserResponse convertToUserResponse(User user) {
        UserResponse userResponse = new UserResponse();
        userResponse.setId(user.getId());
        userResponse.setUsername(user.getUsername());
        userResponse.setEmail(user.getEmail());
        userResponse.setDateOfBirth(user.getDateOfBirth());
        userResponse.setHeightCm(user.getHeightCm());
        userResponse.setWeightKg(user.getWeightKg());
        userResponse.setGender(user.getGender());
        userResponse.setCreatedAt(user.getCreatedAt());

        if (user.getPreferences() != null) {
            UserPreferencesResponse prefsResponse = new UserPreferencesResponse();
            UserPreferences prefs = user.getPreferences();
            prefsResponse.setExperienceLevel(prefs.getExperienceLevel());
            prefsResponse.setFitnessGoals(prefs.getFitnessGoals());
            prefsResponse.setPreferredSportTypes(prefs.getPreferredSportTypes());
            prefsResponse.setAvailableEquipment(prefs.getAvailableEquipment());
            prefsResponse.setWorkoutDurationRange(prefs.getWorkoutDurationRange());
            prefsResponse.setIntensityPreference(prefs.getIntensityPreference());
            prefsResponse.setHealthNotes(prefs.getHealthNotes());
            prefsResponse.setDislikedExercises(prefs.getDislikedExercises());
            userResponse.setPreferences(prefsResponse);
        }

        return userResponse;
    }
}
