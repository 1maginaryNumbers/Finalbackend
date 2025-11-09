const mongoose = require("mongoose");

const sumbanganSchema = new mongoose.Schema({
  namaEvent: { type: String, required: true },
  deskripsi: { type: String },
  bankName: { type: String, required: true },
  bankNumber: { type: String, required: true },
  qrisImage: { type: String },
  targetDana: { type: Number, required: true },
  danaTerkumpul: { type: Number, default: 0 },
  status: { type: String, enum: ['aktif', 'selesai', 'ditutup'], default: 'aktif' },
  tanggalMulai: { type: Date, default: Date.now },
  tanggalSelesai: { type: Date }
});

module.exports = mongoose.model("Sumbangan", sumbanganSchema);
