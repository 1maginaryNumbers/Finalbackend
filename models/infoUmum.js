const mongoose = require("mongoose");

const jamOperasionalSchema = new mongoose.Schema({
  hari: { type: [String], required: true }, // Array of days
  jamBuka: { type: String, required: true },
  jamTutup: { type: String, required: true },
  tutup: { type: Boolean, default: false }
}, { _id: false });

const tanggalKhususSchema = new mongoose.Schema({
  tanggal: { type: Date, required: true },
  keterangan: { type: String }, // Optional description (e.g., "Hari Raya Nyepi", "Tahun Baru")
  tutup: { type: Boolean, default: true } // Always closed on exceptional dates
}, { _id: false });

const jadwalPujaBaktiSchema = new mongoose.Schema({
  hari: { type: [String], required: true }, // Array of days
  waktu: { type: String, required: true }, // Time (e.g., "08:00", "10:00", "19:00")
  keterangan: { type: String } // Optional description
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
  tanggalKhusus: [tanggalKhususSchema], // Exceptional dates (holidays, closures)
  jadwalPujaBakti: [jadwalPujaBaktiSchema], // Prayer schedule
  tanggalUpdate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("InfoUmum", infoUmumSchema);
