const Saran = require("../models/saran");
const { logActivity } = require("../utils/activityLogger");

exports.createSaran = async (req, res) => {
  try {
    const { namaLengkap, email, nomorTelepon, kategori, kritikSaran, captchaAnswer, captchaSum } = req.body;
    
    if (!namaLengkap || !kritikSaran) {
      return res.status(400).json({ message: "Nama lengkap and kritik saran are required" });
    }
    
    if (captchaAnswer === undefined || captchaSum === undefined) {
      return res.status(400).json({ message: "Captcha verification is required" });
    }
    
    if (parseInt(captchaAnswer) !== parseInt(captchaSum)) {
      return res.status(400).json({ message: "Captcha verification failed" });
    }
    
    const saran = new Saran({
      namaLengkap,
      email,
      nomorTelepon,
      kategori,
      kritikSaran
    });
    
    await saran.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'SARAN',
      entityId: saran._id,
      entityName: saran.namaLengkap,
      description: `Created new saran from: ${saran.namaLengkap}`,
      details: { 
        namaLengkap: saran.namaLengkap, 
        email: saran.email,
        kategori: saran.kategori
      }
    });
    
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
