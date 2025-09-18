const mongoose = require("mongoose");

const pengumumanSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  isi: { type: String, required: true },
  tanggalPublikasi: { type: Date, default: Date.now },
  penulis: { type: mongoose.Schema.Types.ObjectId, ref: 'Admins' }
});

module.exports = mongoose.model("Pengumuman", pengumumanSchema);
