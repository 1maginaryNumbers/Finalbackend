const mongoose = require("mongoose");

const sumbanganSchema = new mongoose.Schema({
  bankName: { type: String },
  bankNumber: { type: String },
  qrisImage: { type: String },
  qrisString: { type: String },
  qrisPaymentLink: { type: String },
  qrisUpdatedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Sumbangan", sumbanganSchema);
