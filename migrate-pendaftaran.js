const mongoose = require('mongoose');
const Pendaftaran = require('./models/pendaftaran');
const Kegiatan = require('./models/kegiatan');

async function migratePendaftaranData() {
  try {
    console.log('🔄 Starting migration to add namaKegiatan to existing Pendaftaran records...');
    
    const pendaftaranWithoutNamaKegiatan = await Pendaftaran.find({ 
      namaKegiatan: { $exists: false } 
    });
    
    console.log(`📊 Found ${pendaftaranWithoutNamaKegiatan.length} records to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const pendaftaran of pendaftaranWithoutNamaKegiatan) {
      try {
        const kegiatan = await Kegiatan.findById(pendaftaran.kegiatan);
        
        if (kegiatan) {
          pendaftaran.namaKegiatan = kegiatan.namaKegiatan;
          await pendaftaran.save();
          migratedCount++;
          console.log(`✅ Migrated: ${pendaftaran.namaLengkap} -> ${kegiatan.namaKegiatan}`);
        } else {
          console.log(`❌ Kegiatan not found for pendaftaran: ${pendaftaran._id}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`❌ Error migrating pendaftaran ${pendaftaran._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);
    console.log(`📊 Total processed: ${pendaftaranWithoutNamaKegiatan.length} records`);
    
    if (migratedCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 All new registrations will now include namaKegiatan in the database.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

if (require.main === module) {
  migratePendaftaranData()
    .then(() => {
      console.log('Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migratePendaftaranData;
