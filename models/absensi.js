const mongoose = require("mongoose");

const absensiSchema = new mongoose.Schema({
  pendaftaran: { type: mongoose.Schema.Types.ObjectId, ref: 'Pendaftaran', required: true },
  kegiatan: { type: mongoose.Schema.Types.ObjectId, ref: 'Kegiatan', required: true },
  tanggal: { type: Date, default: Date.now },
  status: { type: String, enum: ['hadir', 'tidak_hadir'], default: 'hadir' },
  tipePerson: { type: String, enum: ['internal', 'external'], default: 'external' },
  qrCode: { type: String }
});

module.exports = mongoose.model("Absensi", absensiSchema);
