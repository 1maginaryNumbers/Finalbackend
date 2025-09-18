const mongoose = require("mongoose");

const umatSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  kontak: { type: String },
  alamat: { type: String },
  email: { type: String },
});

module.exports = mongoose.model("Umat", umatSchema);
