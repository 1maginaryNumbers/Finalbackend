const mongoose = require("mongoose");

const pendaftaranSchema = new mongoose.Schema({
  kegiatan: { type: mongoose.Schema.Types.ObjectId, ref: 'Kegiatan', required: true },
  namaKegiatan: { type: String, required: true },
  namaLengkap: { type: String, required: true },
  email: { type: String, required: true },
  nomorTelepon: { type: String, required: true },
  tanggalDaftar: { type: Date, default: Date.now },
  tipePerson: { type: String, enum: ['internal', 'external'], default: 'external' },
  qrCode: { type: String }
});

module.exports = mongoose.model("Pendaftaran", pendaftaranSchema);
