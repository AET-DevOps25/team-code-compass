/**
 * Authentication Integration Tests
 * Tests user registration and login via direct service AND API Gateway
 * Requires running services: user-service, api-gateway
 */

const http = require('http');
const https = require('https');
const assert = require('assert');

// Test configuration
const CONFIG = {
  // Direct service endpoints
  USER_SERVICE_DIRECT: 'http://localhost:8081',
  
  // API Gateway endpoints  
  API_GATEWAY: 'http://localhost:8080',
  
  // Test user data
  TEST_USER: {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    dateOfBirth: '1990-01-01',
    gender: 'MALE',
    heightCm: 175,
    weightKg: 70
  }
};

// HTTP request helper
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
async function waitForService(serviceUrl, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await makeRequest(`${serviceUrl}/actuator/health`);
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

// Test suite
async function runAuthIntegrationTests() {
  console.log('\n🧪 Running Authentication Integration Tests...\n');
  
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Wait for services to be ready
    console.log('📋 Checking service availability...');
    await waitForService(CONFIG.USER_SERVICE_DIRECT);
    await waitForService(CONFIG.API_GATEWAY);
    
    // Test 1: User Registration via Direct Service
    console.log('\n📋 Test 1: User Registration via Direct Service');
    testResults.total++;
    
    try {
      const registerResponse = await makeRequest(
        `${CONFIG.USER_SERVICE_DIRECT}/api/v1/users/register`,
        {
          method: 'POST',
          body: CONFIG.TEST_USER
        }
      );
      
      assert.strictEqual(registerResponse.statusCode, 201, 'Registration should return 201');
      assert.ok(registerResponse.data.id, 'Response should contain user ID');
      assert.strictEqual(registerResponse.data.email, CONFIG.TEST_USER.email, 'Email should match');
      
      console.log('✅ Direct service registration passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ Direct service registration failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 1: ${error.message}`);
    }

    // Test 2: User Login via Direct Service
    console.log('\n📋 Test 2: User Login via Direct Service');
    testResults.total++;
    
    try {
      const loginResponse = await makeRequest(
        `${CONFIG.USER_SERVICE_DIRECT}/auth/login`,
        {
          method: 'POST',
          body: {
            email: CONFIG.TEST_USER.email,
            password: CONFIG.TEST_USER.password
          }
        }
      );
      
      assert.strictEqual(loginResponse.statusCode, 200, 'Login should return 200');
      assert.ok(loginResponse.data.token, 'Response should contain JWT token');
      assert.ok(loginResponse.data.user && loginResponse.data.user.id, 'Response should contain user ID');
      
      // Store token for later tests
      CONFIG.AUTH_TOKEN = loginResponse.data.token;
      CONFIG.USER_ID = loginResponse.data.user.id;
      
      console.log('✅ Direct service login passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ Direct service login failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 2: ${error.message}`);
    }

    // Test 3: User Registration via API Gateway
    console.log('\n📋 Test 3: User Registration via API Gateway');
    testResults.total++;
    
    try {
      const gatewayUser = {
        ...CONFIG.TEST_USER,
        username: `gateway_user_${Date.now()}`,
        email: `gateway_${Date.now()}@example.com`
      };
      
      const gatewayRegisterResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/user-service/api/v1/users/register`,
        {
          method: 'POST',
          body: gatewayUser
        }
      );
      
      assert.strictEqual(gatewayRegisterResponse.statusCode, 201, 'Gateway registration should return 201');
      assert.ok(gatewayRegisterResponse.data.id, 'Response should contain user ID');
      assert.strictEqual(gatewayRegisterResponse.data.email, gatewayUser.email, 'Email should match');
      
      // Store gateway user for login test
      CONFIG.GATEWAY_USER = gatewayUser;
      
      console.log('✅ API Gateway registration passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ API Gateway registration failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 3: ${error.message}`);
    }

    // Test 4: User Login via API Gateway
    console.log('\n📋 Test 4: User Login via API Gateway');
    testResults.total++;
    
    try {
      const gatewayLoginResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/user-service/auth/login`,
        {
          method: 'POST',
          body: {
            email: CONFIG.GATEWAY_USER.email,
            password: CONFIG.GATEWAY_USER.password
          }
        }
      );
      
      assert.strictEqual(gatewayLoginResponse.statusCode, 200, 'Gateway login should return 200');
      assert.ok(gatewayLoginResponse.data.token, 'Response should contain JWT token');
      assert.ok(gatewayLoginResponse.data.user && gatewayLoginResponse.data.user.id, 'Response should contain user ID');
      
      // Store gateway token for workout tests
      CONFIG.GATEWAY_AUTH_TOKEN = gatewayLoginResponse.data.token;
      CONFIG.GATEWAY_USER_ID = gatewayLoginResponse.data.user.id;
      
      console.log('✅ API Gateway login passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ API Gateway login failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 4: ${error.message}`);
    }

    // Test 5: Protected Route Access with JWT (Direct Service)
    console.log('\n📋 Test 5: Protected Route Access via Direct Service');
    testResults.total++;
    
    try {
      const profileResponse = await makeRequest(
        `${CONFIG.USER_SERVICE_DIRECT}/api/v1/users/${CONFIG.USER_ID}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
          }
        }
      );
      
      assert.strictEqual(profileResponse.statusCode, 200, 'Protected route should return 200 with valid token');
      assert.strictEqual(profileResponse.data.email, CONFIG.TEST_USER.email, 'Should return correct user data');
      
      console.log('✅ Direct service protected route access passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ Direct service protected route access failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 5: ${error.message}`);
    }

    // Test 6: Protected Route Access with JWT (API Gateway)
    console.log('\n📋 Test 6: Protected Route Access via API Gateway');
    testResults.total++;
    
    try {
      const gatewayProfileResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/user-service/api/v1/users/${CONFIG.GATEWAY_USER_ID}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${CONFIG.GATEWAY_AUTH_TOKEN}`
          }
        }
      );
      
      assert.strictEqual(gatewayProfileResponse.statusCode, 200, 'Gateway protected route should return 200');
      assert.strictEqual(gatewayProfileResponse.data.email, CONFIG.GATEWAY_USER.email, 'Should return correct user data');
      
      console.log('✅ API Gateway protected route access passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ API Gateway protected route access failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 6: ${error.message}`);
    }

    // Test 7: Unauthorized Access (No Token)
    console.log('\n📋 Test 7: Unauthorized Access Validation');
    testResults.total++;
    
    try {
      const unauthorizedResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/user-service/api/v1/users/${CONFIG.GATEWAY_USER_ID}`,
        {
          method: 'GET'
          // No Authorization header
        }
      );
      
      assert.ok([401, 403].includes(unauthorizedResponse.statusCode), 
        'Should return 401/403 for unauthorized access');
      
      console.log('✅ Unauthorized access validation passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ Unauthorized access validation failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 7: ${error.message}`);
    }

    // Test 8: Invalid Token Access
    console.log('\n📋 Test 8: Invalid Token Validation');
    testResults.total++;
    
    try {
      const invalidTokenResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/user-service/api/v1/users/${CONFIG.GATEWAY_USER_ID}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer invalid-token-12345'
          }
        }
      );
      
      assert.ok([401, 403].includes(invalidTokenResponse.statusCode), 
        'Should return 401/403 for invalid token');
      
      console.log('✅ Invalid token validation passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ Invalid token validation failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 8: ${error.message}`);
    }

  } catch (error) {
    console.error('💥 Test suite setup failed:', error.message);
    return false;
  }

  // Print results
  console.log('\n📊 Authentication Integration Test Results:');
  console.log('==========================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach(error => console.log(`  • ${error}`));
  }
  
  const success = testResults.failed === 0;
  console.log(`\n${success ? '🎉 All authentication integration tests passed!' : '❌ Some tests failed'}`);
  
  // Export tokens for other integration tests
  global.INTEGRATION_TEST_TOKENS = {
    directToken: CONFIG.AUTH_TOKEN,
    directUserId: CONFIG.USER_ID,
    gatewayToken: CONFIG.GATEWAY_AUTH_TOKEN,
    gatewayUserId: CONFIG.GATEWAY_USER_ID
  };
  
  return success;
}

// Export for use in other test files
module.exports = {
  runAuthIntegrationTests,
  CONFIG
};

// Run tests if executed directly
if (require.main === module) {
  runAuthIntegrationTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
} 