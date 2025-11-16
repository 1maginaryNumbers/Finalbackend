const mongoose = require("mongoose");

const transaksiSchema = new mongoose.Schema({
  sumbangan: { type: mongoose.Schema.Types.ObjectId, ref: 'Sumbangan', required: true },
  namaDonatur: { type: String, required: true },
  email: { type: String },
  nomorTelepon: { type: String },
  nominal: { type: Number, required: true },
  metodePembayaran: { type: String, default: 'transfer' },
  status: { type: String, enum: ['pending', 'berhasil', 'gagal', 'settlement', 'capture', 'deny', 'cancel', 'expire', 'refund'], default: 'pending' },
  tanggalTransaksi: { type: Date, default: Date.now },
  buktiPembayaran: { type: String },
  paymentGateway: { type: String, enum: ['manual', 'midtrans'], default: 'manual' },
  midtransOrderId: { type: String },
  midtransTransactionId: { type: String },
  midtransTransactionStatus: { type: String },
  midtransPaymentType: { type: String },
  midtransVaNumber: { type: String },
  midtransBank: { type: String }
});

module.exports = mongoose.model("Transaksi", transaksiSchema);
