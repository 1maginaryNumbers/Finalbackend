const Umat = require("../models/umat");

exports.createUmat = async (req, res) => {
  try {
    const { nama, email, kontak, alamat } = req.body;
    
    if (!nama) {
      return res.status(400).json({ message: "Nama is required" });
    }
    
    if (email) {
      const existingUmat = await Umat.findOne({ email });
      if (existingUmat) {
        return res.status(409).json({ message: "Email already registered" });
      }
    }
    
    const umat = new Umat({
      nama,
      email,
      kontak,
      alamat
    });
    
    await umat.save();
    
    res.status(201).json({
      message: "Umat created successfully",
      umat
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating umat",
      error: err.message
    });
  }
};

exports.getAllUmat = async (req, res) => {
  try {
    const umat = await Umat.find().sort({ nama: 1 });
    res.json(umat);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching umat",
      error: err.message
    });
  }
};

exports.getUmatById = async (req, res) => {
  try {
    const umat = await Umat.findById(req.params.id);
    
    if (!umat) {
      return res.status(404).json({ message: "Umat not found" });
    }
    
    res.json(umat);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching umat",
      error: err.message
    });
  }
};

exports.updateUmat = async (req, res) => {
  try {
    const { nama, email, kontak, alamat } = req.body;
    
    const umat = await Umat.findById(req.params.id);
    
    if (!umat) {
      return res.status(404).json({ message: "Umat not found" });
    }
    
    if (email && email !== umat.email) {
      const existingUmat = await Umat.findOne({ email });
      if (existingUmat) {
        return res.status(409).json({ message: "Email already registered" });
      }
    }
    
    if (nama) umat.nama = nama;
    if (email) umat.email = email;
    if (kontak) umat.kontak = kontak;
    if (alamat) umat.alamat = alamat;
    
    await umat.save();
    
    res.json({
      message: "Umat updated successfully",
      umat
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating umat",
      error: err.message
    });
  }
};

exports.deleteUmat = async (req, res) => {
  try {
    const umat = await Umat.findByIdAndDelete(req.params.id);
    
    if (!umat) {
      return res.status(404).json({ message: "Umat not found" });
    }
    
    res.json({ message: "Umat deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting umat",
      error: err.message
    });
  }
};

exports.checkUmatByName = async (req, res) => {
  try {
    const { nama } = req.params;
    
    if (!nama) {
      return res.status(400).json({ message: "Nama is required" });
    }
    
    const umat = await Umat.findOne({ 
      nama: { $regex: new RegExp(`^${nama}$`, 'i') } 
    });
    
    res.json({
      exists: !!umat,
      umat: umat || null
    });
  } catch (err) {
    res.status(500).json({
      message: "Error checking umat",
      error: err.message
    });
  }
};