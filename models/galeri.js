const mongoose = require("mongoose");

const galeriSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  url: { type: String, required: true },
  deskripsi: { type: String },
  kategori: { type: String, default: 'umum' },
  tanggalUpload: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Galeri", galeriSchema);
