const mongoose = require("mongoose");

const absensiSchema = new mongoose.Schema({
  umat: { type: mongoose.Schema.Types.ObjectId, ref: 'Umat', required: true },
  kegiatan: { type: mongoose.Schema.Types.ObjectId, ref: 'Kegiatan', required: true },
  tanggal: { type: Date, default: Date.now },
  status: { type: String, enum: ['hadir', 'tidak_hadir'], default: 'hadir' },
  qrCode: { type: String }
});

module.exports = mongoose.model("Absensi", absensiSchema);
