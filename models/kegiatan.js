const mongoose = require("mongoose");

const kegiatanSchema = new mongoose.Schema({
  namaKegiatan: { type: String, required: true },
  deskripsi: { type: String, required: true },
  tanggalMulai: { type: Date, required: true },
  tanggalSelesai: { type: Date, required: true },
  waktuMulai: { type: String },
  waktuSelesai: { type: String },
  tempat: { type: String },
  kapasitas: { type: Number },
  kategori: { type: mongoose.Schema.Types.ObjectId, ref: 'KategoriJadwal' },
  status: { type: String, enum: ['akan_datang', 'sedang_berlangsung', 'selesai'], default: 'akan_datang' },
  
});

module.exports = mongoose.model("Kegiatan", kegiatanSchema);
