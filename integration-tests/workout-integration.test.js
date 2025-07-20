/**
 * Workout Generation Integration Tests
 * Tests full workout generation flow: API Gateway → Workout Plan Service → GenAI Workers
 * Tests AI preference routing (cloud vs local) through the complete stack
 * Requires running services: api-gateway, workout-plan-service, genai-worker-cloud, genai-worker-local
 */

const http = require('http');
const assert = require('assert');

// Import authentication utilities
const { CONFIG: AUTH_CONFIG } = require('./auth-integration.test.js');

// Test configuration
const CONFIG = {
  // Service endpoints
  API_GATEWAY: 'http://localhost:8080',
  WORKOUT_SERVICE_DIRECT: 'http://localhost:8082',
  GENAI_CLOUD_DIRECT: 'http://localhost:8083',
  GENAI_LOCAL_DIRECT: 'http://localhost:8084',
  
  // Test workout data
  TEST_WORKOUT_REQUEST: {
    dayDate: '2025-01-20', // Fixed date for consistent testing
    focusSportType: 'STRENGTH',
    targetDurationMinutes: 45,
    textPrompt: 'I want a muscle building workout focusing on chest and back using dumbbells and resistance bands. I prefer compound movements and have intermediate experience.'
  }
};

// HTTP request helper (reusing from auth tests)
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Health check helper
async function waitForService(serviceUrl, endpoint = '/health', maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await makeRequest(`${serviceUrl}${endpoint}`);
      if (response.statusCode === 200) {
        console.log(`✅ Service ${serviceUrl} is ready`);
        return true;
      }
    } catch (error) {
      console.log(`⏳ Waiting for service ${serviceUrl}... (${i + 1}/${maxRetries})`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error(`Service ${serviceUrl} not available after ${maxRetries} retries`);
}

// Test authentication and get tokens
async function setupAuthentication() {
  console.log('🔐 Setting up authentication...');
  
  // Create test user for workout tests
  const testUser = {
    username: `workout_user_${Date.now()}`,
    email: `workout_${Date.now()}@example.com`,
    password: 'WorkoutTest123!',
    dateOfBirth: '1990-01-01',
    gender: 'MALE',
    heightCm: 175,
    weightKg: 70
  };

  // Register user via API Gateway
  const registerResponse = await makeRequest(
    `${CONFIG.API_GATEWAY}/user-service/api/v1/users/register`,
    {
      method: 'POST',
      body: testUser
    }
  );

  if (registerResponse.statusCode !== 201) {
    throw new Error(`User registration failed: ${registerResponse.statusCode}`);
  }

  // Login via API Gateway
  const loginResponse = await makeRequest(
    `${CONFIG.API_GATEWAY}/user-service/auth/login`,
    {
      method: 'POST',
      body: {
        email: testUser.email,
        password: testUser.password
      }
    }
  );

  if (loginResponse.statusCode !== 200) {
    throw new Error(`User login failed: ${loginResponse.statusCode}`);
  }

  console.log('✅ Authentication setup complete');
  return {
    token: loginResponse.data.token,
    userId: loginResponse.data.user.id,
    user: testUser
  };
}

// Test suite
async function runWorkoutIntegrationTests() {
  console.log('\n🧪 Running Workout Generation Integration Tests...\n');
  
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  let authData;

  try {
    // Wait for all services to be ready
    console.log('📋 Checking service availability...');
    await waitForService(CONFIG.API_GATEWAY, '/actuator/health');
    await waitForService(CONFIG.WORKOUT_SERVICE_DIRECT, '/actuator/health');
    await waitForService(CONFIG.GENAI_CLOUD_DIRECT);
    await waitForService(CONFIG.GENAI_LOCAL_DIRECT);
    
    // Setup authentication
    authData = await setupAuthentication();
    
    // Test 1: Workout Generation via API Gateway with Cloud AI
    console.log('\n📋 Test 1: Workout Generation via API Gateway (Cloud AI)');
    testResults.total++;
    
    try {
      const cloudWorkoutRequest = {
        ...CONFIG.TEST_WORKOUT_REQUEST,
        userId: authData.userId,
        aiPreference: 'cloud'
      };
      
      const cloudResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/workout-plan-service/api/v1/plans/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          },
          body: cloudWorkoutRequest
        }
      );
      
      assert.strictEqual(cloudResponse.statusCode, 200, 'Cloud AI workout generation should return 200');
      assert.ok(cloudResponse.data.id, 'Response should contain workout ID');
      assert.ok(cloudResponse.data.markdownContent, 'Response should contain workout content');
      assert.ok(cloudResponse.data.scheduledExercises, 'Response should contain scheduled exercises');
      assert.ok(Array.isArray(cloudResponse.data.scheduledExercises), 'Scheduled exercises should be an array');
      
      // Store workout ID for further tests
      CONFIG.CLOUD_WORKOUT_ID = cloudResponse.data.id;
      
      console.log('✅ API Gateway Cloud AI workout generation passed');
      console.log(`   Generated workout with ${cloudResponse.data.scheduledExercises.length} exercises`);
      testResults.passed++;
    } catch (error) {
      console.error('❌ API Gateway Cloud AI workout generation failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 1: ${error.message}`);
    }

    // Test 2: Workout Generation via API Gateway with Local AI
    console.log('\n📋 Test 2: Workout Generation via API Gateway (Local AI)');
    testResults.total++;
    
    try {
      const localWorkoutRequest = {
        ...CONFIG.TEST_WORKOUT_REQUEST,
        userId: authData.userId,
        aiPreference: 'local'
      };
      
      const localResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/workout-plan-service/api/v1/plans/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          },
          body: localWorkoutRequest
        }
      );
      
      assert.strictEqual(localResponse.statusCode, 200, 'Local AI workout generation should return 200');
      assert.ok(localResponse.data.id, 'Response should contain workout ID');
      assert.ok(localResponse.data.markdownContent, 'Response should contain workout content');
      assert.ok(localResponse.data.scheduledExercises, 'Response should contain scheduled exercises');
      assert.ok(Array.isArray(localResponse.data.scheduledExercises), 'Scheduled exercises should be an array');
      
      // Store workout ID for further tests
      CONFIG.LOCAL_WORKOUT_ID = localResponse.data.id;
      
      console.log('✅ API Gateway Local AI workout generation passed');
      console.log(`   Generated workout with ${localResponse.data.scheduledExercises.length} exercises`);
      testResults.passed++;
    } catch (error) {
      console.error('❌ API Gateway Local AI workout generation failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 2: ${error.message}`);
    }

    // Test 3: Direct Workout Service with Cloud AI (bypass API Gateway)
    console.log('\n📋 Test 3: Direct Workout Service (Cloud AI)');
    testResults.total++;
    
    try {
      const directCloudRequest = {
        ...CONFIG.TEST_WORKOUT_REQUEST,
        userId: authData.userId,
        aiPreference: 'cloud'
      };
      
      const directCloudResponse = await makeRequest(
        `${CONFIG.WORKOUT_SERVICE_DIRECT}/api/v1/plans/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          },
          body: directCloudRequest
        }
      );
      
      assert.strictEqual(directCloudResponse.statusCode, 200, 'Direct Cloud AI workout should return 200');
      assert.ok(directCloudResponse.data.id, 'Response should contain workout ID');
      
      console.log('✅ Direct workout service Cloud AI passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ Direct workout service Cloud AI failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 3: ${error.message}`);
    }

    // Test 4: Direct Workout Service with Local AI (bypass API Gateway)
    console.log('\n📋 Test 4: Direct Workout Service (Local AI)');
    testResults.total++;
    
    try {
      const directLocalRequest = {
        ...CONFIG.TEST_WORKOUT_REQUEST,
        userId: authData.userId,
        aiPreference: 'local'
      };
      
      const directLocalResponse = await makeRequest(
        `${CONFIG.WORKOUT_SERVICE_DIRECT}/api/v1/plans/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          },
          body: directLocalRequest
        }
      );
      
      assert.strictEqual(directLocalResponse.statusCode, 200, 'Direct Local AI workout should return 200');
      assert.ok(directLocalResponse.data.id, 'Response should contain workout ID');
      
      console.log('✅ Direct workout service Local AI passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ Direct workout service Local AI failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 4: ${error.message}`);
    }

    // Test 5: Workout Generation without AI Preference (should default to cloud)
    console.log('\n📋 Test 5: Workout Generation without AI Preference (Default Routing)');
    testResults.total++;
    
    try {
      const defaultRequest = {
        ...CONFIG.TEST_WORKOUT_REQUEST,
        userId: authData.userId
        // No aiPreference - should default to cloud
      };
      
      const defaultResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/workout-plan-service/api/v1/plans/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          },
          body: defaultRequest
        }
      );
      
      assert.strictEqual(defaultResponse.statusCode, 200, 'Default AI routing should return 200');
      assert.ok(defaultResponse.data.id, 'Response should contain workout ID');
      
      console.log('✅ Default AI preference routing passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ Default AI preference routing failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 5: ${error.message}`);
    }

    // Test 6: Workout Generation with Invalid AI Preference
    console.log('\n📋 Test 6: Workout Generation with Invalid AI Preference');
    testResults.total++;
    
    try {
      const invalidRequest = {
        ...CONFIG.TEST_WORKOUT_REQUEST,
        userId: authData.userId,
        aiPreference: 'invalid_ai_type'
      };
      
      const invalidResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/workout-plan-service/api/v1/plans/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          },
          body: invalidRequest
        }
      );
      
      // Should still succeed but default to cloud AI
      assert.strictEqual(invalidResponse.statusCode, 200, 'Invalid AI preference should still succeed');
      assert.ok(invalidResponse.data.id, 'Response should contain workout ID');
      
      console.log('✅ Invalid AI preference handling passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ Invalid AI preference handling failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 6: ${error.message}`);
    }

    // Test 7: Unauthorized Workout Generation
    console.log('\n📋 Test 7: Unauthorized Workout Generation');
    testResults.total++;
    
    try {
      const unauthorizedRequest = {
        ...CONFIG.TEST_WORKOUT_REQUEST,
        userId: authData.userId,
        aiPreference: 'cloud'
      };
      
      const unauthorizedResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/workout-plan-service/api/v1/plans/generate`,
        {
          method: 'POST',
          // No Authorization header
          body: unauthorizedRequest
        }
      );
      
      // Check if the response indicates unauthorized access (401, 403) or bad request due to missing auth (400)
      assert.ok([400, 401, 403].includes(unauthorizedResponse.statusCode), 
        `Unauthorized request should return 400/401/403, got ${unauthorizedResponse.statusCode}`);
      
      console.log(`✅ Unauthorized workout generation validation passed (${unauthorizedResponse.statusCode})`);
      testResults.passed++;
    } catch (error) {
      console.error('❌ Unauthorized workout generation validation failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 7: ${error.message}`);
    }

    // Test 8: GenAI Service Health Checks via API Gateway
    console.log('\n📋 Test 8: GenAI Service Health Checks');
    testResults.total++;
    
    try {
      // Check cloud GenAI health
      const cloudHealthResponse = await makeRequest(`${CONFIG.GENAI_CLOUD_DIRECT}/health`);
      assert.strictEqual(cloudHealthResponse.statusCode, 200, 'Cloud GenAI health should return 200');
      
      // Check local GenAI health
      const localHealthResponse = await makeRequest(`${CONFIG.GENAI_LOCAL_DIRECT}/health`);
      assert.strictEqual(localHealthResponse.statusCode, 200, 'Local GenAI health should return 200');
      
      console.log('✅ GenAI service health checks passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ GenAI service health checks failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 8: ${error.message}`);
    }



  } catch (error) {
    console.error('💥 Test suite setup failed:', error.message);
    return false;
  }

  // Print results
  console.log('\n📊 Workout Integration Test Results:');
  console.log('====================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach(error => console.log(`  • ${error}`));
  }
  
  const success = testResults.failed === 0;
  console.log(`\n${success ? '🎉 All workout integration tests passed!' : '❌ Some tests failed'}`);
  
  return success;
}

// Export for use in other test files
module.exports = {
  runWorkoutIntegrationTests,
  CONFIG
};

// Run tests if executed directly
if (require.main === module) {
  runWorkoutIntegrationTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
} 