package com.flexfit.workoutplanservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "eureka.client.enabled=false",
    "spring.cloud.discovery.enabled=false",
    "flexfit.services.user-service.url=http://localhost:8081",
    "flexfit.services.genai-service.url=http://localhost:8083"
})
class WorkoutPlanServiceApplicationTests {

	@Test
	void contextLoads() {
		// This test ensures that the Spring context loads successfully
		// with the test configuration
	}

}
