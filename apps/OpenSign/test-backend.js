// Quick test script to verify backend connectivity
import authService from './src/services/authService.js';

console.log('Testing Java Backend Connection...\n');

// Test signup
try {
  const testUser = {
    username: `frontend_test_${Date.now()}`,
    email: `frontend_test_${Date.now()}@example.com`,
    password: 'Test123!',
    name: 'Frontend Test User'
  };
  
  console.log('1. Testing signup...');
  const signupResult = await authService.signup(
    testUser.username,
    testUser.email,
    testUser.password,
    testUser.name
  );
  console.log('✓ Signup successful:', signupResult);
  
  // Test logout
  console.log('\n2. Testing logout...');
  authService.logout();
  console.log('✓ Logout successful');
  
  // Test login
  console.log('\n3. Testing login...');
  const loginResult = await authService.login(testUser.username, testUser.password);
  console.log('✓ Login successful:', loginResult);
  
  console.log('\n✅ All tests passed! Backend integration is working.');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Details:', error.response?.data || error);
}
