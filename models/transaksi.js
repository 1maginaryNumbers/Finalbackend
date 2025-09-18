const mongoose = require("mongoose");

const transaksiSchema = new mongoose.Schema({
  sumbangan: { type: mongoose.Schema.Types.ObjectId, ref: 'Sumbangan', required: true },
  namaDonatur: { type: String, required: true },
  email: { type: String },
  nominal: { type: Number, required: true },
  metodePembayaran: { type: String, default: 'transfer' },
  status: { type: String, enum: ['pending', 'berhasil', 'gagal'], default: 'pending' },
  tanggalTransaksi: { type: Date, default: Date.now },
  buktiPembayaran: { type: String }
});

module.exports = mongoose.model("Transaksi", transaksiSchema);
