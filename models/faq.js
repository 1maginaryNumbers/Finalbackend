const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema({
  pertanyaan: { type: String, required: true },
  jawaban: { type: String, required: true },
  urutan: { type: Number, default: 0 },
  status: { type: String, enum: ['aktif', 'nonaktif'], default: 'aktif' }
}, {
  timestamps: true
});

module.exports = mongoose.model("FAQ", faqSchema);

