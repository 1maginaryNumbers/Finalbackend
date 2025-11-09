const mongoose = require("mongoose");

const kategoriJadwalSchema = new mongoose.Schema({
  nama: { type: String, required: true, unique: true },
  warna: { type: String, default: '#3b82f6' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("KategoriJadwal", kategoriJadwalSchema);

