import { testDatabaseConnection } from '../src/cloud/customSupabase';

async function run() {
  console.log('--- Starting Custom Supabase Connection Test ---');
  
  const success = await testDatabaseConnection();
  
  if (success) {
    console.log('\n✨ Test passed successfully.');
    process.exit(0);
  } else {
    console.error('\n💀 Test failed.');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
