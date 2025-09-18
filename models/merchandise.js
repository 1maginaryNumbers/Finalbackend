const mongoose = require("mongoose");

const merchandiseSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  harga: { type: Number, required: true },
  deskripsi: { type: String },
  stok: { type: Number, default: 0 },
  kategori: { type: String, default: 'umum' },
  gambar: { type: String },
  status: { type: String, enum: ['tersedia', 'habis'], default: 'tersedia' }
});

module.exports = mongoose.model("Merchandise", merchandiseSchema);
