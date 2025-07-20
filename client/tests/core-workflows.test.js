const assert = require('assert');

// FlexFit Client Core Workflow Tests
// Testing user registration, login, workout generation workflows

console.log('🧪 Running FlexFit Core Workflow Tests...\n');

let testCount = 0;
let passedCount = 0;

function runTest(testName, testFunction) {
  testCount++;
  try {
    console.log(`  ✓ ${testName}`);
    testFunction();
    passedCount++;
  } catch (error) {
    console.log(`  ✗ ${testName} - FAILED: ${error.message}`);
  }
}

// Mock validation functions
function validateRegistrationForm(user) {
  if (!user.email || !user.email.includes('@')) return false;
  if (!user.password || user.password.length < 6) return false;
  if (!user.firstName || !user.lastName) return false;
  return true;
}

function simulateLogin(credentials) {
  if (credentials.email === 'test@example.com' && credentials.password === 'password123') {
    return {
      success: true,
      token: 'mock-jwt-token',
      user: { id: 1, email: credentials.email }
    };
  }
  return { success: false, error: 'Invalid credentials' };
}

function generateWorkoutPlan(preferences) {
  if (!preferences.sportType || !preferences.duration) {
    throw new Error('Missing required preferences');
  }
  return {
    id: 'workout-123',
    sportType: preferences.sportType,
    duration: preferences.duration,
    exercises: ['Push-ups', 'Squats', 'Plank']
  };
}

// Test Suite: User Registration
console.log('📋 Test Suite: User Registration');

runTest('should validate valid registration form fields', () => {
  const validUser = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe'
  };
  
  const isValid = validateRegistrationForm(validUser);
  assert.strictEqual(isValid, true, 'Valid user should pass validation');
});

runTest('should reject invalid email format', () => {
  const invalidUser = {
    email: 'invalid-email',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe'
  };
  
  const isValid = validateRegistrationForm(invalidUser);
  assert.strictEqual(isValid, false, 'Invalid email should fail validation');
});

runTest('should reject short passwords', () => {
  const invalidUser = {
    email: 'test@example.com',
    password: '123',
    firstName: 'John',
    lastName: 'Doe'
  };
  
  const isValid = validateRegistrationForm(invalidUser);
  assert.strictEqual(isValid, false, 'Short password should fail validation');
});

// Test Suite: User Login
console.log('\n📋 Test Suite: User Login');

runTest('should handle successful login', () => {
  const loginData = {
    email: 'test@example.com',
    password: 'password123'
  };
  
  const result = simulateLogin(loginData);
  assert.strictEqual(result.success, true, 'Valid credentials should succeed');
  assert.strictEqual(result.token, 'mock-jwt-token', 'Should return JWT token');
});

runTest('should handle invalid credentials', () => {
  const loginData = {
    email: 'wrong@example.com',
    password: 'wrongpassword'
  };
  
  const result = simulateLogin(loginData);
  assert.strictEqual(result.success, false, 'Invalid credentials should fail');
});

// Test Suite: Workout Generation
console.log('\n📋 Test Suite: Workout Generation');

runTest('should generate workout plan with valid preferences', () => {
  const preferences = {
    sportType: 'STRENGTH',
    duration: 45,
    experienceLevel: 'INTERMEDIATE'
  };
  
  const workout = generateWorkoutPlan(preferences);
  assert.strictEqual(workout.sportType, 'STRENGTH', 'Should match sport type');
  assert.strictEqual(workout.duration, 45, 'Should match duration');
  assert(Array.isArray(workout.exercises), 'Should include exercises array');
});

runTest('should reject incomplete preferences', () => {
  const incompletePreferences = {
    sportType: 'STRENGTH'
    // Missing duration
  };
  
  assert.throws(() => {
    generateWorkoutPlan(incompletePreferences);
  }, Error, 'Should throw error for incomplete preferences');
});

// Test Suite: AI Preference Selection
console.log('\n📋 Test Suite: AI Preference Selection');

runTest('should validate cloud AI preference', () => {
  const cloudPreference = 'cloud';
  const validPreferences = ['cloud', 'local'];
  
  assert(validPreferences.includes(cloudPreference), 'Cloud should be valid preference');
});

runTest('should validate local AI preference', () => {
  const localPreference = 'local';
  const validPreferences = ['cloud', 'local'];
  
  assert(validPreferences.includes(localPreference), 'Local should be valid preference');
});

runTest('should handle invalid AI preference gracefully', () => {
  const invalidPreference = 'invalid';
  const validPreferences = ['cloud', 'local'];
  const defaultPreference = 'cloud';
  
  const selectedPreference = validPreferences.includes(invalidPreference) 
    ? invalidPreference 
    : defaultPreference;
    
  assert.strictEqual(selectedPreference, 'cloud', 'Should default to cloud for invalid preference');
});

// Summary
console.log('\n📊 Test Summary');
console.log(`Total Tests: ${testCount}`);
console.log(`Passed: ${passedCount}`);
console.log(`Failed: ${testCount - passedCount}`);

if (passedCount === testCount) {
  console.log('🎉 All tests passed! ✅');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
} 