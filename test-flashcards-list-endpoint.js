/**
 * Manual test script for GET /api/flashcards endpoint
 * 
 * Usage:
 * 1. Set JWT_TOKEN environment variable with a valid JWT token
 * 2. Run: node test-flashcards-list-endpoint.js
 * 
 * Or use curl commands directly from the terminal
 */

const BASE_URL = 'http://localhost:4321';
const JWT_TOKEN = process.env.JWT_TOKEN || 'YOUR_JWT_TOKEN_HERE';

if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
  console.error('❌ Please set JWT_TOKEN environment variable');
  console.error('   Example: JWT_TOKEN=your-token-here node test-flashcards-list-endpoint.js');
  process.exit(1);
}

const tests = [
  {
    name: '1. Basic request (default parameters)',
    url: `${BASE_URL}/api/flashcards`,
    expectedStatus: 200,
    description: 'Should return first 20 flashcards sorted by created_at desc'
  },
  {
    name: '2. Custom pagination (limit=10, offset=0)',
    url: `${BASE_URL}/api/flashcards?limit=10&offset=0`,
    expectedStatus: 200,
    description: 'Should return first 10 flashcards'
  },
  {
    name: '3. Second page (limit=20, offset=20)',
    url: `${BASE_URL}/api/flashcards?limit=20&offset=20`,
    expectedStatus: 200,
    description: 'Should return flashcards 21-40'
  },
  {
    name: '4. Filter by manual source',
    url: `${BASE_URL}/api/flashcards?filter[source]=manual`,
    expectedStatus: 200,
    description: 'Should return only manually created flashcards'
  },
  {
    name: '5. Filter by ai_full source',
    url: `${BASE_URL}/api/flashcards?filter[source]=ai_full`,
    expectedStatus: 200,
    description: 'Should return only AI-generated unedited flashcards'
  },
  {
    name: '6. Filter by ai_edited source',
    url: `${BASE_URL}/api/flashcards?filter[source]=ai_edited`,
    expectedStatus: 200,
    description: 'Should return only AI-generated edited flashcards'
  },
  {
    name: '7. Sort ascending',
    url: `${BASE_URL}/api/flashcards?sort[created_at]=asc`,
    expectedStatus: 200,
    description: 'Should return flashcards sorted by created_at ascending'
  },
  {
    name: '8. Sort descending (explicit)',
    url: `${BASE_URL}/api/flashcards?sort[created_at]=desc`,
    expectedStatus: 200,
    description: 'Should return flashcards sorted by created_at descending'
  },
  {
    name: '9. Combination of parameters',
    url: `${BASE_URL}/api/flashcards?limit=5&offset=10&filter[source]=manual&sort[created_at]=asc`,
    expectedStatus: 200,
    description: 'Should apply all filters, sorting, and pagination'
  },
  {
    name: '10. Maximum limit (100)',
    url: `${BASE_URL}/api/flashcards?limit=100`,
    expectedStatus: 200,
    description: 'Should return up to 100 flashcards'
  },
  {
    name: '11. Large offset',
    url: `${BASE_URL}/api/flashcards?limit=20&offset=1000`,
    expectedStatus: 200,
    description: 'Should return empty items array if offset exceeds total'
  },
  {
    name: '12. Invalid limit (too small)',
    url: `${BASE_URL}/api/flashcards?limit=0`,
    expectedStatus: 400,
    description: 'Should return validation error'
  },
  {
    name: '13. Invalid limit (too large)',
    url: `${BASE_URL}/api/flashcards?limit=101`,
    expectedStatus: 400,
    description: 'Should return validation error'
  },
  {
    name: '14. Invalid offset (negative)',
    url: `${BASE_URL}/api/flashcards?offset=-1`,
    expectedStatus: 400,
    description: 'Should return validation error'
  },
  {
    name: '15. Invalid source filter',
    url: `${BASE_URL}/api/flashcards?filter[source]=invalid`,
    expectedStatus: 400,
    description: 'Should return validation error'
  },
  {
    name: '16. Invalid sort direction',
    url: `${BASE_URL}/api/flashcards?sort[created_at]=invalid`,
    expectedStatus: 400,
    description: 'Should return validation error'
  },
  {
    name: '17. Non-numeric limit',
    url: `${BASE_URL}/api/flashcards?limit=abc`,
    expectedStatus: 400,
    description: 'Should return validation error'
  },
  {
    name: '18. Non-numeric offset',
    url: `${BASE_URL}/api/flashcards?offset=xyz`,
    expectedStatus: 400,
    description: 'Should return validation error'
  },
];

async function runTest(test) {
  try {
    console.log(`\n🧪 ${test.name}`);
    console.log(`   ${test.description}`);
    console.log(`   URL: ${test.url}`);

    const response = await fetch(test.url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    const statusMatch = response.status === test.expectedStatus;

    if (statusMatch) {
      console.log(`   ✅ Status: ${response.status} (expected ${test.expectedStatus})`);
    } else {
      console.log(`   ❌ Status: ${response.status} (expected ${test.expectedStatus})`);
    }

    if (response.status === 200) {
      console.log(`   📊 Results: ${data.items.length} items, total: ${data.total}, limit: ${data.limit}, offset: ${data.offset}`);
      
      if (data.items.length > 0) {
        console.log(`   📝 First item: ${data.items[0].front.substring(0, 50)}...`);
      }
    } else {
      console.log(`   ⚠️  Error: ${data.code} - ${data.message}`);
    }

    return statusMatch;
  } catch (error) {
    console.error(`   ❌ Request failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting manual tests for GET /api/flashcards\n');
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await runTest(test);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\n📈 Test Summary:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
  }
}

// Test without authentication
async function testUnauthorized() {
  console.log('\n🔒 Testing unauthorized access...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/flashcards`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.status === 401 && data.code === 'Unauthorized') {
      console.log('   ✅ Correctly returns 401 Unauthorized without token');
    } else {
      console.log(`   ❌ Unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.error(`   ❌ Request failed: ${error.message}`);
  }
}

// Run all tests
(async () => {
  await testUnauthorized();
  await runAllTests();
})();

/**
 * CURL EXAMPLES:
 * 
 * You can also test manually using curl commands:
 * 
 * # Basic request
 * curl -X GET "http://localhost:4321/api/flashcards" \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN"
 * 
 * # With pagination
 * curl -X GET "http://localhost:4321/api/flashcards?limit=10&offset=0" \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN"
 * 
 * # With filter
 * curl -X GET "http://localhost:4321/api/flashcards?filter[source]=ai_full" \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN"
 * 
 * # With sorting
 * curl -X GET "http://localhost:4321/api/flashcards?sort[created_at]=asc" \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN"
 * 
 * # Combination
 * curl -X GET "http://localhost:4321/api/flashcards?limit=5&offset=10&filter[source]=manual&sort[created_at]=desc" \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN"
 * 
 * # Without authorization (should return 401)
 * curl -X GET "http://localhost:4321/api/flashcards"
 * 
 * # Invalid parameters (should return 400)
 * curl -X GET "http://localhost:4321/api/flashcards?limit=101" \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN"
 */

