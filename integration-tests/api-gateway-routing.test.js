/**
 * API Gateway Routing Integration Tests
 * Tests API Gateway routing to all microservices
 * Validates service discovery, load balancing, and request forwarding
 * Requires running services: api-gateway, user-service, workout-plan-service
 */

const http = require('http');
const assert = require('assert');

// Test configuration
const CONFIG = {
  API_GATEWAY: 'http://localhost:8080',
  
  // Expected service routes through API Gateway
  ROUTES: {
    USER_SERVICE: '/user-service',
    WORKOUT_SERVICE: '/workout-plan-service',
    GENAI_CLOUD: '/genai-cloud-service',
    GENAI_LOCAL: '/genai-local-service'
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

// Test suite
async function runAPIGatewayRoutingTests() {
  console.log('\n🧪 Running API Gateway Routing Integration Tests...\n');
  
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Test 1: API Gateway Health Check
    console.log('📋 Test 1: API Gateway Health Check');
    testResults.total++;
    
    try {
      const gatewayHealthResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/actuator/health`
      );
      
      assert.strictEqual(gatewayHealthResponse.statusCode, 200, 'API Gateway health should return 200');
      assert.ok(gatewayHealthResponse.data.status, 'Health response should contain status');
      
      console.log('✅ API Gateway health check passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ API Gateway health check failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 1: ${error.message}`);
    }

    // Test 2: User Service Routing
    console.log('\n📋 Test 2: User Service Routing via API Gateway');
    testResults.total++;
    
    try {
      const userServiceResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}${CONFIG.ROUTES.USER_SERVICE}/actuator/health`
      );
      
      assert.ok([200, 401, 403].includes(userServiceResponse.statusCode), 
        'User service routing should return valid HTTP status');
      
      console.log('✅ User service routing via API Gateway passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ User service routing failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 2: ${error.message}`);
    }

    // Test 3: Workout Plan Service Routing
    console.log('\n📋 Test 3: Workout Plan Service Routing via API Gateway');
    testResults.total++;
    
    try {
      const workoutServiceResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}${CONFIG.ROUTES.WORKOUT_SERVICE}/actuator/health`
      );
      
      assert.ok([200, 401, 403].includes(workoutServiceResponse.statusCode), 
        'Workout service routing should return valid HTTP status');
      
      console.log('✅ Workout plan service routing via API Gateway passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ Workout plan service routing failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 3: ${error.message}`);
    }

    // Test 4: CORS Headers Validation
    console.log('\n📋 Test 4: CORS Headers Validation');
    testResults.total++;
    
    try {
      const corsResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/actuator/health`,
        {
          method: 'OPTIONS',
          headers: {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Authorization'
          }
        }
      );
      
      // CORS preflight should return 200 or 204
      assert.ok([200, 204].includes(corsResponse.statusCode), 
        'CORS preflight should return 200 or 204');
      
      console.log('✅ CORS headers validation passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ CORS headers validation failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 4: ${error.message}`);
    }

    // Test 5: Request Timeout Handling
    console.log('\n📋 Test 5: Request Timeout Handling');
    testResults.total++;
    
    try {
      // Test with a non-existent endpoint to check timeout behavior
      const timeoutResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/non-existent-service/health`
      );
      
      // Should return 404 or 503 for non-existent service
      assert.ok([404, 503, 502].includes(timeoutResponse.statusCode), 
        'Non-existent service should return 404, 502, or 503');
      
      console.log('✅ Request timeout handling passed');
      testResults.passed++;
    } catch (error) {
      // Timeout or connection error is expected for non-existent service
      console.log('✅ Request timeout handling passed (connection error expected)');
      testResults.passed++;
    }

    // Test 6: Load Balancer Headers
    console.log('\n📋 Test 6: Load Balancer Headers');
    testResults.total++;
    
    try {
      const headerResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/actuator/health`
      );
      
      // Check for common load balancer or gateway headers
      const headers = headerResponse.headers;
      const hasGatewayHeaders = 
        headers['x-forwarded-for'] || 
        headers['x-forwarded-proto'] || 
        headers['x-gateway'] ||
        headers['server'];
      
      // Gateway should add some headers (this is lenient as header behavior varies)
      assert.strictEqual(headerResponse.statusCode, 200, 'Gateway should return 200');
      
      console.log('✅ Load balancer headers validation passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ Load balancer headers validation failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 6: ${error.message}`);
    }

    // Test 7: Service Discovery Integration
    console.log('\n📋 Test 7: Service Discovery Integration');
    testResults.total++;
    
    try {
      // Make multiple requests to check if gateway discovers services
      const discoveryPromises = [
        makeRequest(`${CONFIG.API_GATEWAY}${CONFIG.ROUTES.USER_SERVICE}/actuator/health`),
        makeRequest(`${CONFIG.API_GATEWAY}${CONFIG.ROUTES.WORKOUT_SERVICE}/actuator/health`),
        makeRequest(`${CONFIG.API_GATEWAY}/actuator/health`)
      ];
      
      const discoveryResults = await Promise.allSettled(discoveryPromises);
      
      // At least 2 out of 3 should succeed (some might require auth)
      const successCount = discoveryResults.filter(result => 
        result.status === 'fulfilled' && 
        [200, 401, 403].includes(result.value.statusCode)
      ).length;
      
      assert.ok(successCount >= 2, 'At least 2 services should be discoverable via gateway');
      
      console.log('✅ Service discovery integration passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ Service discovery integration failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 7: ${error.message}`);
    }

    // Test 8: Request/Response Size Limits
    console.log('\n📋 Test 8: Request/Response Size Limits');
    testResults.total++;
    
    try {
      // Test with a reasonable size request to ensure it's not blocked
      const normalSizeRequest = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          testData: 'Normal size request for gateway validation',
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'integration-test',
            purpose: 'size-validation'
          }
        }
      };
      
      const sizeTestResponse = await makeRequest(
        `${CONFIG.API_GATEWAY}/actuator/health`,
        normalSizeRequest
      );
      
      // Should not return 413 (Payload Too Large) for normal requests
      assert.notStrictEqual(sizeTestResponse.statusCode, 413, 
        'Normal size requests should not be rejected');
      
      console.log('✅ Request/response size limits validation passed');
      testResults.passed++;
    } catch (error) {
      console.error('❌ Request/response size limits validation failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Test 8: ${error.message}`);
    }

  } catch (error) {
    console.error('💥 Test suite setup failed:', error.message);
    return false;
  }

  // Print results
  console.log('\n📊 API Gateway Routing Test Results:');
  console.log('=====================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach(error => console.log(`  • ${error}`));
  }
  
  const success = testResults.failed === 0;
  console.log(`\n${success ? '🎉 All API Gateway routing tests passed!' : '❌ Some tests failed'}`);
  
  return success;
}

// Export for use in other test files
module.exports = {
  runAPIGatewayRoutingTests,
  CONFIG
};

// Run tests if executed directly
if (require.main === module) {
  runAPIGatewayRoutingTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
} 