// Simple test script for the generations endpoint
// Run with: node test-generation.js

const testEndpoint = async () => {
  const testData = {
    source_text: "JavaScript is a programming language that is widely used for web development. It was created by Brendan Eich in 1995 and has since become one of the most popular programming languages in the world. JavaScript can be used for both frontend and backend development. On the frontend, it allows developers to create interactive web pages with dynamic content. On the backend, with the help of Node.js, JavaScript can be used to build server-side applications, APIs, and databases. JavaScript is an interpreted language, which means it doesn't need to be compiled before running. It supports various programming paradigms including object-oriented, functional, and procedural programming. Modern JavaScript includes features like arrow functions, promises, async/await, destructuring, and modules."
  };

  try {
    console.log('Testing POST /api/generations endpoint...');
    console.log('Request data:', { source_text_length: testData.source_text.length });

    const response = await fetch('http://localhost:4321/api/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.json();
    console.log('Response data:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('✅ Test passed! Generation created successfully.');
      console.log(`Generated ${responseData.generated_count} flashcards`);
    } else {
      console.log('❌ Test failed with error:', responseData);
    }

  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
  }
};

// Test validation errors
const testValidation = async () => {
  console.log('\n--- Testing validation errors ---');
  
  const testCases = [
    { 
      name: 'Empty source_text', 
      data: { source_text: '' } 
    },
    { 
      name: 'Too short source_text', 
      data: { source_text: 'Short text' } 
    },
    { 
      name: 'Too long source_text', 
      data: { source_text: 'A'.repeat(16000) } 
    },
    { 
      name: 'Missing source_text', 
      data: {} 
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\nTesting: ${testCase.name}`);
      const response = await fetch('http://localhost:4321/api/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      });

      const responseData = await response.json();
      console.log(`Status: ${response.status}, Response:`, responseData);

    } catch (error) {
      console.error(`Error in ${testCase.name}:`, error.message);
    }
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting API endpoint tests...\n');
  
  // Test successful generation
  await testEndpoint();
  
  // Test validation errors
  await testValidation();
  
  console.log('\n✨ Tests completed!');
};

runTests().catch(console.error);
