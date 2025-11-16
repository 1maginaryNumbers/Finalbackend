const mongoose = require("mongoose");

const sumbanganSchema = new mongoose.Schema({
  namaEvent: { type: String, required: true },
  deskripsi: { type: String },
  bankName: { type: String },
  bankNumber: { type: String },
  qrisImage: { type: String },
  qrisString: { type: String },
  qrisExpirationDate: { type: Date },
  targetDana: { type: Number, required: true },
  danaTerkumpul: { type: Number, default: 0 },
  status: { type: String, enum: ['aktif', 'selesai', 'ditutup'], default: 'aktif' },
  tanggalMulai: { type: Date, default: Date.now },
  tanggalSelesai: { type: Date }
});

module.exports = mongoose.model("Sumbangan", sumbanganSchema);
