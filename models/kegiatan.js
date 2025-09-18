const mongoose = require("mongoose");

const kegiatanSchema = new mongoose.Schema({
  namaKegiatan: { type: String, required: true },
  deskripsi: { type: String, required: true },
  tanggalMulai: { type: Date, required: true },
  tanggalSelesai: { type: Date, required: true },
  waktu: { type: String },
  tempat: { type: String },
  kapasitas: { type: Number },
  status: { type: String, enum: ['akan_datang', 'aktif', 'selesai'], default: 'akan_datang' },
  
});

module.exports = mongoose.model("Kegiatan", kegiatanSchema);
