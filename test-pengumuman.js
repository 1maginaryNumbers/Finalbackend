const axios = require('axios');

async function testPengumuman() {
  try {
    console.log('Testing pengumuman endpoint...');
    
    const response = await axios.get('https://finalbackend-ochre.vercel.app/api/pengumuman');
    console.log('✅ Pengumuman endpoint working!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Error testing pengumuman endpoint:');
    console.log('Error:', error.response?.data || error.message);
  }
}

testPengumuman();
