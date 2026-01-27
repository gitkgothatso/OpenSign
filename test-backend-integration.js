#!/usr/bin/env node
/**
 * Backend Integration Test Script
 * Tests the OpenSign Server API endpoints from the frontend perspective
 * 
 * Usage: node test-backend-integration.js
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logSection(message) {
  log(`\n${message}`, 'bold');
  log('='.repeat(60), 'cyan');
}

async function testEndpoint(name, url, options = {}) {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    const correlationId = response.headers.get('x-correlation-id');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (response.ok) {
      logSuccess(`${name} - ${response.status} ${response.statusText}`);
      if (correlationId) {
        logInfo(`  Correlation ID: ${correlationId}`);
      }
      return { success: true, status: response.status, data, correlationId };
    } else {
      logError(`${name} - ${response.status} ${response.statusText}`);
      console.log('  Response:', data);
      return { success: false, status: response.status, data, error: data };
    }
  } catch (error) {
    logError(`${name} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'bold');
  log('║     OpenSign Server - Backend Integration Tests          ║', 'bold');
  log('╚════════════════════════════════════════════════════════════╝', 'bold');
  
  logInfo(`\nTesting API at: ${API_URL}\n`);

  let testsPassed = 0;
  let testsFailed = 0;
  let jwtToken = null;
  let testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPass123!',
    name: 'Integration Test User',
  };

  // Test 1: Health Check
  logSection('1. Health Check & Infrastructure');
  let result = await testEndpoint(
    'Actuator Health',
    `${API_URL}/actuator/health`
  );
  // Health check might be DOWN due to mail server - accept 503 as warning, not failure
  if (result.success || result.status === 503) {
    if (result.status === 503) {
      logInfo('  Warning: Health check DOWN (likely mail server unavailable)');
    }
    testsPassed++;
  } else {
    testsFailed++;
  }

  // Test 2: OpenAPI Documentation
  result = await testEndpoint(
    'OpenAPI Spec',
    `${API_URL}/v3/api-docs`
  );
  result.success ? testsPassed++ : testsFailed++;

  // Test 3: Swagger UI
  result = await testEndpoint(
    'Swagger UI',
    `${API_URL}/swagger-ui/index.html`
  );
  result.success ? testsPassed++ : testsFailed++;

  // Test 4: User Signup
  logSection('2. Authentication - User Signup');
  result = await testEndpoint(
    'POST /api/v1/auth/signup',
    `${API_URL}/api/v1/auth/signup`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    }
  );
  
  if (result.success && result.data.jwtToken) {
    jwtToken = result.data.jwtToken;
    logInfo(`  User ID: ${result.data.userId}`);
    logInfo(`  JWT Token: ${jwtToken.substring(0, 50)}...`);
    testsPassed++;
  } else {
    testsFailed++;
  }

  // Test 5: User Login
  logSection('3. Authentication - User Login');
  result = await testEndpoint(
    'POST /api/v1/auth/login',
    `${API_URL}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password,
      }),
    }
  );

  if (result.success && result.data.jwtToken) {
    jwtToken = result.data.jwtToken;
    logInfo(`  Login successful for: ${result.data.username}`);
    testsPassed++;
  } else {
    testsFailed++;
  }

  if (!jwtToken) {
    logError('Cannot continue without JWT token');
    printSummary(testsPassed, testsFailed);
    return;
  }

  // Test 6: Get User Profile
  logSection('4. User Profile - Get Current User');
  result = await testEndpoint(
    'GET /api/v1/users/me',
    `${API_URL}/api/v1/users/me`,
    {
      headers: { 'Authorization': `Bearer ${jwtToken}` },
    }
  );

  if (result.success) {
    logInfo(`  Username: ${result.data.username}`);
    logInfo(`  Email: ${result.data.email}`);
    logInfo(`  Name: ${result.data.name}`);
    testsPassed++;
  } else {
    testsFailed++;
  }

  // Test 7: Update User Profile
  logSection('5. User Profile - Update Profile');
  result = await testEndpoint(
    'PUT /api/v1/users/me',
    `${API_URL}/api/v1/users/me`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Updated Test User',
        phone: '+27123456789',
        company: 'Test Company',
        jobTitle: 'QA Tester',
        timezone: 'Africa/Johannesburg',
      }),
    }
  );

  if (result.success) {
    logInfo(`  Updated name: ${result.data.name}`);
    logInfo(`  Phone: ${result.data.phone}`);
    logInfo(`  Company: ${result.data.company}`);
    testsPassed++;
  } else {
    testsFailed++;
  }

  // Test 8: Change Password
  logSection('6. User Profile - Change Password');
  const newPassword = 'NewTestPass123!';
  result = await testEndpoint(
    'POST /api/v1/users/change-password',
    `${API_URL}/api/v1/users/change-password`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: testUser.password,
        newPassword: newPassword,
      }),
    }
  );

  if (result.success) {
    logInfo('  Password changed successfully');
    testUser.password = newPassword; // Update for future tests
    testsPassed++;
  } else {
    testsFailed++;
  }

  // Test 9: Delete User Account
  logSection('7. User Profile - Delete Account (Cleanup)');
  result = await testEndpoint(
    'DELETE /api/v1/users/me',
    `${API_URL}/api/v1/users/me`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwtToken}` },
    }
  );

  if (result.success) {
    logInfo('  Account deleted successfully');
    testsPassed++;
  } else {
    testsFailed++;
  }

  // Test 10: Verify account is deleted (should return 404)
  logSection('8. Verification - Account Deleted');
  result = await testEndpoint(
    'GET /api/v1/users/me (should fail)',
    `${API_URL}/api/v1/users/me`,
    {
      headers: { 'Authorization': `Bearer ${jwtToken}` },
    }
  );

  if (!result.success && result.status === 404) {
    logSuccess('Account correctly returns 404 after deletion');
    testsPassed++;
  } else {
    logError('Account should not be accessible after deletion');
    testsFailed++;
  }

  // Print summary
  printSummary(testsPassed, testsFailed);
}

function printSummary(passed, failed) {
  logSection('Test Summary');
  log(`Total Tests: ${passed + failed}`, 'bold');
  logSuccess(`Passed: ${passed}`);
  
  if (failed > 0) {
    logError(`Failed: ${failed}`);
    log('\n❌ Some tests failed. Please check the backend server logs.', 'red');
    process.exit(1);
  } else {
    log('\n✅ All tests passed! Backend integration is working correctly.', 'green');
    log('\nNext steps:', 'cyan');
    log('  1. Import services in your React components:', 'cyan');
    log('     import { authService, userProfileService } from \'./services\';', 'cyan');
    log('  2. Check BACKEND_INTEGRATION.md for examples', 'cyan');
    log('  3. View API docs: http://localhost:8080/swagger-ui/index.html', 'cyan');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
