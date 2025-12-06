/**
 * Test script for POST /api/flashcards endpoint
 * Run with: node test-flashcards-endpoint.js
 */

const BASE_URL = 'http://localhost:4321';

/**
 * Test cases for flashcards endpoint
 */
const testCases = [
  {
    name: 'Valid manual flashcard creation',
    payload: {
      flashcards: [
        {
          front: 'What is the capital of France?',
          back: 'Paris',
          source: 'manual',
        },
      ],
    },
    expectedStatus: 201,
  },
  {
    name: 'Multiple manual flashcards',
    payload: {
      flashcards: [
        {
          front: 'What is 2 + 2?',
          back: '4',
          source: 'manual',
        },
        {
          front: 'What is the largest planet?',
          back: 'Jupiter',
          source: 'manual',
        },
      ],
    },
    expectedStatus: 201,
  },
  {
    name: 'AI flashcard with generation_id',
    payload: {
      flashcards: [
        {
          front: 'AI generated question',
          back: 'AI generated answer',
          source: 'ai_full',
          generation_id: '4d803b8f-2add-4610-9af3-2103e9b6714b', // This should exist or be created first
        },
      ],
    },
    expectedStatus: 201, // or 404 if generation doesn't exist
  },
  {
    name: 'Invalid - empty flashcards array',
    payload: {
      flashcards: [],
    },
    expectedStatus: 400,
  },
  {
    name: 'Invalid - missing generation_id for AI source',
    payload: {
      flashcards: [
        {
          front: 'AI question without generation_id',
          back: 'AI answer',
          source: 'ai_full',
        },
      ],
    },
    expectedStatus: 400,
  },
  {
    name: 'Invalid - front text too long',
    payload: {
      flashcards: [
        {
          front: 'A'.repeat(301), // Exceeds 300 character limit
          back: 'Short answer',
          source: 'manual',
        },
      ],
    },
    expectedStatus: 400,
  },
  {
    name: 'Invalid - back text too long',
    payload: {
      flashcards: [
        {
          front: 'Short question',
          back: 'B'.repeat(501), // Exceeds 500 character limit
          source: 'manual',
        },
      ],
    },
    expectedStatus: 400,
  },
  {
    name: 'Invalid - invalid source',
    payload: {
      flashcards: [
        {
          front: 'Question',
          back: 'Answer',
          source: 'invalid_source',
        },
      ],
    },
    expectedStatus: 400,
  },
  {
    name: 'Invalid - malformed JSON',
    payload: '{"flashcards": [invalid json}',
    expectedStatus: 400,
    isRawPayload: true,
  },
];

/**
 * Execute a test case
 */
async function runTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);

  try {
    const response = await fetch(`${BASE_URL}/api/flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: testCase.isRawPayload ? testCase.payload : JSON.stringify(testCase.payload),
    });

    const status = response.status;
    let responseData;

    try {
      responseData = await response.json();
    } catch (e) {
      responseData = await response.text();
    }

    // Check if status matches expected
    const statusMatch = status === testCase.expectedStatus;
    const statusIcon = statusMatch ? '✅' : '❌';

    console.log(`   ${statusIcon} Status: ${status} (expected: ${testCase.expectedStatus})`);

    if (status === 201) {
      console.log(`   📊 Created ${Array.isArray(responseData) ? responseData.length : 0} flashcards`);
      if (Array.isArray(responseData) && responseData.length > 0) {
        console.log(`   🆔 First flashcard ID: ${responseData[0].id}`);
      }
    } else if (status >= 400) {
      console.log(`   ⚠️  Error: ${responseData.message || responseData}`);
    }

    return {
      name: testCase.name,
      passed: statusMatch,
      status,
      expectedStatus: testCase.expectedStatus,
      response: responseData,
    };
  } catch (error) {
    console.log(`   💥 Network Error: ${error.message}`);
    return {
      name: testCase.name,
      passed: false,
      error: error.message,
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting flashcards endpoint tests...\n');
  console.log(`📡 Testing endpoint: ${BASE_URL}/api/flashcards`);

  const results = [];

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n📋 Test Summary:');
  console.log('================');

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed < total) {
    console.log('\n❌ Failed tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.error || `Expected ${r.expectedStatus}, got ${r.status}`}`);
      });
  }

  console.log('\n🏁 Tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, runTest, testCases };
