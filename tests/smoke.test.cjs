const http = require('http');

const PORT = 4321;
const URL = `http://localhost:${PORT}/`;

function testPage() {
  console.log(`Testing ${URL}...`);

  http.get(URL, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS: Page loaded with status 200');

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (data.includes('ALEX B.')) {
          console.log('✅ SUCCESS: Found expected content ("ALEX B.")');
          process.exit(0);
        } else {
          console.error('❌ FAILURE: Page loaded but content "ALEX B." not found');
          process.exit(1);
        }
      });
    } else {
      console.error(`❌ FAILURE: Page returned status ${res.statusCode}`);
      process.exit(1);
    }
  }).on('error', (err) => {
    console.error(`❌ FAILURE: Could not connect to server: ${err.message}`);
    console.log('\nMake sure "npm run dev" is running before starting the test.');
    process.exit(1);
  });
}

testPage();
