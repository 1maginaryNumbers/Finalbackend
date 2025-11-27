const mongoose = require("mongoose");

const sumbanganSchema = new mongoose.Schema({
  qrisImage: { type: String },
  qrisString: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Sumbangan", sumbanganSchema);
