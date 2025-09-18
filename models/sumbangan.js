const mongoose = require("mongoose");

const sumbanganSchema = new mongoose.Schema({
  namaPaket: { type: String, required: true },
  deskripsi: { type: String },
  targetDana: { type: Number, required: true },
  danaTerkumpul: { type: Number, default: 0 },
  status: { type: String, enum: ['aktif', 'selesai', 'ditutup'], default: 'aktif' },
  tanggalMulai: { type: Date, default: Date.now },
  tanggalSelesai: { type: Date }
});

module.exports = mongoose.model("Sumbangan", sumbanganSchema);
