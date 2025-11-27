const mongoose = require("mongoose");

const paketSumbanganTransaksiSchema = new mongoose.Schema({
  paketSumbangan: { type: mongoose.Schema.Types.ObjectId, ref: 'PaketSumbangan', required: true },
  namaPembeli: { type: String, required: true },
  email: { type: String },
  nomorTelepon: { type: String },
  nominal: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'berhasil', 'gagal', 'settlement', 'capture', 'deny', 'cancel', 'expire', 'refund'], default: 'pending' },
  tanggalTransaksi: { type: Date, default: Date.now },
  paymentGateway: { type: String, enum: ['manual', 'midtrans'], default: 'midtrans' },
  midtransOrderId: { type: String },
  midtransTransactionId: { type: String },
  midtransTransactionStatus: { type: String },
  midtransPaymentType: { type: String },
  midtransVaNumber: { type: String },
  midtransBank: { type: String }
});

module.exports = mongoose.model("PaketSumbanganTransaksi", paketSumbanganTransaksiSchema);

