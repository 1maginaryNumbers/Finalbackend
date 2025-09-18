const mongoose = require("mongoose");

const infoUmumSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  isi: { type: String, required: true },
  jamBuka: { type: String, default: '08:00 - 17:00' },
  alamat: { type: String },
  telepon: { type: String },
  email: { type: String },
  website: { type: String },
  tanggalUpdate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("InfoUmum", infoUmumSchema);
