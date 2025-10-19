const mongoose = require("mongoose");

const saranSchema = new mongoose.Schema({
  namaLengkap: { type: String, required: true },
  email: { type: String },
  nomorTelepon: { type: String },
  kategori: { type: String },
  kritikSaran: { type: String, required: true },
  tanggal: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'read', 'responded'], default: 'pending' }
});

module.exports = mongoose.model("Saran", saranSchema);
