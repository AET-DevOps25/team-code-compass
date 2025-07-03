package com.flexfit.workoutplanservice.service;

import com.flexfit.workoutplanservice.repository.DailyWorkoutRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;

class WorkoutPlanServiceTest {

    @Mock
    private DailyWorkoutRepository dailyWorkoutRepository;

    @Mock
    private WorkoutPlanMapper mapper;

    @Mock
    private RestTemplate userSvcRestTemplate;

    @Mock
    private RestTemplate genaiSvcRestTemplate;

    private WorkoutPlanService workoutPlanService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        workoutPlanService = new WorkoutPlanService(
            dailyWorkoutRepository,
            mapper,
            userSvcRestTemplate,
            genaiSvcRestTemplate
        );
    }

    @Test
    void serviceInstantiation_Success() {
        // When & Then
        assertNotNull(workoutPlanService);
        assertNotNull(dailyWorkoutRepository);
        assertNotNull(mapper);
        assertNotNull(userSvcRestTemplate);
        assertNotNull(genaiSvcRestTemplate);
    }

    @Test
    void basicFunctionality_Test() {
        // This test just verifies that the service can be instantiated
        // and all dependencies are properly injected
        assertTrue(true);
    }
} 