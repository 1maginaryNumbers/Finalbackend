const mongoose = require("mongoose");

const detailBarangSchema = new mongoose.Schema({
  namaBarang: { type: String, required: true },
  jumlah: { type: Number, required: true, default: 1 },
  keterangan: { type: String }
});

const paketSumbanganSchema = new mongoose.Schema({
  namaPaket: { type: String, required: true },
  deskripsi: { type: String },
  nominal: { type: Number, required: true },
  detailBarang: [detailBarangSchema],
  status: { type: String, enum: ['aktif', 'nonaktif'], default: 'nonaktif' },
  tanggalMulai: { type: Date },
  tanggalSelesai: { type: Date },
  gambar: { type: String },
  stok: { type: Number },
  terjual: { type: Number, default: 0 }
});

module.exports = mongoose.model("PaketSumbangan", paketSumbanganSchema);

