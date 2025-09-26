const mongoose = require('mongoose');
const crypto = require('crypto');
const QRCode = require('qrcode');
require('dotenv').config();

const Pendaftaran = require('./models/pendaftaran');

const generateQRCode = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/temple-management');
    console.log('Connected to MongoDB');

    const pendaftaranWithoutQR = await Pendaftaran.find({ 
      $or: [
        { qrCode: { $exists: false } },
        { qrCodeData: { $exists: false } }
      ]
    });
    console.log(`Found ${pendaftaranWithoutQR.length} pendaftaran entries without QR codes`);

    for (const pendaftaran of pendaftaranWithoutQR) {
      try {
        const qrCodeData = crypto.randomBytes(16).toString('hex');
        const qrCodeImage = await QRCode.toDataURL(qrCodeData);
        
        pendaftaran.qrCode = qrCodeImage;
        pendaftaran.qrCodeData = qrCodeData;
        await pendaftaran.save();
        
        console.log(`Generated QR code for: ${pendaftaran.namaLengkap}`);
      } catch (error) {
        console.error(`Error generating QR code for ${pendaftaran.namaLengkap}:`, error.message);
      }
    }

    console.log('QR code generation completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

generateQRCode();
