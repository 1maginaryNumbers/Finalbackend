const mongoose = require("mongoose");

const saranSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  email: { type: String, required: true },
  pesan: { type: String, required: true },
  tanggal: { type: Date, default: Date.now },
  status: { type: String, enum: ['baru', 'dibaca', 'direspon'], default: 'baru' }
});

module.exports = mongoose.model("Saran", saranSchema);
