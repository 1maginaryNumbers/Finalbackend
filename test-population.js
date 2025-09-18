const mongoose = require('mongoose');
const Pendaftaran = require('./models/pendaftaran');
const Kegiatan = require('./models/kegiatan');

async function testPendaftaranWithNamaKegiatan() {
  try {
    console.log('Testing Pendaftaran with namaKegiatan stored in database...');
    
    const pendaftaran = await Pendaftaran.findById('68cc60defa2d8d1159054f6f');
    
    if (pendaftaran) {
      console.log('✅ Successfully retrieved pendaftaran:');
      console.log('Registration ID:', pendaftaran._id);
      console.log('Participant:', pendaftaran.namaLengkap);
      console.log('Email:', pendaftaran.email);
      console.log('Event Name (stored in DB):', pendaftaran.namaKegiatan);
      console.log('Event ID:', pendaftaran.kegiatan);
      console.log('QR Code:', pendaftaran.qrCode);
      console.log('Registration Date:', pendaftaran.tanggalDaftar);
      
      console.log('\n📊 Database Structure:');
      console.log('- kegiatan: ObjectId (reference to Kegiatan collection)');
      console.log('- namaKegiatan: String (event name stored directly)');
      console.log('- namaLengkap: String (participant name)');
      console.log('- email: String (participant email)');
      console.log('- nomorTelepon: String (participant phone)');
      console.log('- qrCode: String (unique QR code)');
      console.log('- tanggalDaftar: Date (registration timestamp)');
    } else {
      console.log('❌ Pendaftaran not found');
    }
  } catch (error) {
    console.error('❌ Error testing pendaftaran:', error.message);
  }
}

testPendaftaranWithNamaKegiatan();
