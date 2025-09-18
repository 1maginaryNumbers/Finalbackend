const Pengumuman = require("../models/pengumuman");

exports.createPengumuman = async (req, res) => {
  try {
    const { judul, isi } = req.body;
    
    if (!judul || !isi) {
      return res.status(400).json({ message: "Judul and isi are required" });
    }
    
    console.log("Admin info:", req.admin);
    
    const pengumuman = new Pengumuman({
      judul,
      isi,
      penulis: req.admin ? req.admin._id : null,
    });
    
    await pengumuman.save();
    
    const populatedPengumuman = await Pengumuman.findById(pengumuman._id)
      .populate('penulis', 'username');
    
    res.status(201).json({
      message: "Pengumuman created successfully",
      pengumuman: populatedPengumuman
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating pengumuman",
      error: err.message
    });
  }
};

exports.getAllPengumuman = async (req, res) => {
  try {
    const pengumuman = await Pengumuman.find()
      .populate('penulis', 'username')
      .sort({ tanggalPublikasi: -1 });
    
    res.json(pengumuman);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching pengumuman",
      error: err.message
    });
  }
};

exports.getPengumumanById = async (req, res) => {
  try {
    const pengumuman = await Pengumuman.findById(req.params.id)
      .populate('penulis', 'username');
    
    if (!pengumuman) {
      return res.status(404).json({ message: "Pengumuman not found" });
    }
    
    res.json(pengumuman);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching pengumuman",
      error: err.message
    });
  }
};

exports.updatePengumuman = async (req, res) => {
  try {
    const { judul, isi } = req.body;
    
    const pengumuman = await Pengumuman.findById(req.params.id);
    
    if (!pengumuman) {
      return res.status(404).json({ message: "Pengumuman not found" });
    }
    
    if (judul) pengumuman.judul = judul;
    if (isi) pengumuman.isi = isi;
    
    await pengumuman.save();
    
    const updatedPengumuman = await Pengumuman.findById(pengumuman._id)
      .populate('penulis', 'username');
    
    res.json({
      message: "Pengumuman updated successfully",
      pengumuman: updatedPengumuman
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating pengumuman",
      error: err.message
    });
  }
};

exports.deletePengumuman = async (req, res) => {
  try {
    const pengumuman = await Pengumuman.findByIdAndDelete(req.params.id);
    
    if (!pengumuman) {
      return res.status(404).json({ message: "Pengumuman not found" });
    }
    
    res.json({ message: "Pengumuman deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting pengumuman",
      error: err.message
    });
  }
};
