const Saran = require("../models/saran");

exports.createSaran = async (req, res) => {
  try {
    const { nama, email, pesan } = req.body;
    
    if (!nama || !email || !pesan) {
      return res.status(400).json({ message: "Nama, email, and pesan are required" });
    }
    
    const saran = new Saran({
      nama,
      email,
      pesan
    });
    
    await saran.save();
    
    res.status(201).json({
      message: "Saran submitted successfully",
      saran
    });
  } catch (err) {
    res.status(500).json({
      message: "Error submitting saran",
      error: err.message
    });
  }
};

exports.getAllSaran = async (req, res) => {
  try {
    const saran = await Saran.find().sort({ tanggal: -1 });
    res.json(saran);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching saran",
      error: err.message
    });
  }
};

exports.getSaranById = async (req, res) => {
  try {
    const saran = await Saran.findById(req.params.id);
    
    if (!saran) {
      return res.status(404).json({ message: "Saran not found" });
    }
    
    res.json(saran);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching saran",
      error: err.message
    });
  }
};

exports.updateSaranStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const saran = await Saran.findById(req.params.id);
    
    if (!saran) {
      return res.status(404).json({ message: "Saran not found" });
    }
    
    if (status) saran.status = status;
    
    await saran.save();
    
    res.json({
      message: "Saran status updated successfully",
      saran
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating saran status",
      error: err.message
    });
  }
};

exports.deleteSaran = async (req, res) => {
  try {
    const saran = await Saran.findByIdAndDelete(req.params.id);
    
    if (!saran) {
      return res.status(404).json({ message: "Saran not found" });
    }
    
    res.json({ message: "Saran deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting saran",
      error: err.message
    });
  }
};
