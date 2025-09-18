const mongoose = require('mongoose');
const Galeri = require('./models/galeri');

async function checkGaleriData() {
  try {
    console.log('🔍 Checking Galeri data in database...\n');
    
    const allGaleri = await Galeri.find();
    console.log(`📊 Total gallery items: ${allGaleri.length}`);
    
    if (allGaleri.length > 0) {
      console.log('\n📋 All gallery items:');
      allGaleri.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item._id}`);
        console.log(`   Judul: ${item.judul}`);
        console.log(`   Kategori: "${item.kategori}"`);
        console.log(`   URL: ${item.url}`);
        console.log(`   Tanggal: ${item.tanggalUpload}`);
        console.log('');
      });
      
      const uniqueKategoris = [...new Set(allGaleri.map(item => item.kategori))];
      console.log(`🏷️  Unique kategoris found: ${uniqueKategoris.join(', ')}`);
      
      console.log('\n🔍 Testing search for "Kegiatan":');
      const kegiatanItems = await Galeri.find({ kategori: 'Kegiatan' });
      console.log(`Found ${kegiatanItems.length} items with kategori "Kegiatan"`);
      
      console.log('\n🔍 Testing case-insensitive search:');
      const caseInsensitiveItems = await Galeri.find({ 
        kategori: { $regex: 'kegiatan', $options: 'i' } 
      });
      console.log(`Found ${caseInsensitiveItems.length} items with kategori containing "kegiatan" (case-insensitive)`);
      
    } else {
      console.log('❌ No gallery items found in database');
      console.log('💡 Try creating a gallery item first using the POST /api/galeri endpoint');
    }
    
  } catch (error) {
    console.error('❌ Error checking galeri data:', error.message);
  }
}

checkGaleriData();
