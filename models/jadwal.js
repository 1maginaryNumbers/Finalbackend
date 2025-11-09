const mongoose = require("mongoose");

const jadwalSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  deskripsi: { type: String },
  tanggal: { type: Date, required: true },
  waktuMulai: { type: String },
  waktuSelesai: { type: String },
  kategori: { type: mongoose.Schema.Types.ObjectId, ref: 'KategoriJadwal' },
  tempat: { type: String },
  kapasitas: { type: Number },
  kegiatanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kegiatan' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Jadwal", jadwalSchema);

