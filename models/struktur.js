const mongoose = require("mongoose");

const strukturSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  jabatan: { type: String, required: true },
  kontak: { type: String },
  periode: { type: String },
  status: { type: String, enum: ['aktif', 'nonaktif'], default: 'aktif' }
});

module.exports = mongoose.model("Struktur", strukturSchema);
