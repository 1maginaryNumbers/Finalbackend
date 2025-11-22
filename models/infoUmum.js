const mongoose = require("mongoose");

const jamOperasionalSchema = new mongoose.Schema({
  hari: { type: String, required: true },
  jamBuka: { type: String, required: true },
  jamTutup: { type: String, required: true },
  tutup: { type: Boolean, default: false }
}, { _id: false });

const infoUmumSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  isi: { type: String, required: true },
  alamat: { type: String },
  telepon: { type: String },
  email: { type: String },
  sejarah: { type: String },
  visi: { type: String },
  misi: { type: String },
  jamOperasional: [jamOperasionalSchema],
  tanggalUpdate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("InfoUmum", infoUmumSchema);
