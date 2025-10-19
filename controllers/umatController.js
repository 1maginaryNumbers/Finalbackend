const Umat = require("../models/umat");
const { logActivity } = require("../utils/activityLogger");

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
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'UMAT',
      entityId: umat._id,
      entityName: umat.nama,
      description: `Created new umat: ${umat.nama}`,
      details: { nama: umat.nama, email: umat.email }
    });
    
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const totalUmat = await Umat.countDocuments();
    const totalPages = Math.ceil(totalUmat / limit);
    
    const umat = await Umat.find()
      .sort({ nama: 1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      umat,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalUmat: totalUmat,
        umatPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
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
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'UMAT',
      entityId: umat._id,
      entityName: umat.nama,
      description: `Updated umat: ${umat.nama}`,
      details: { nama: umat.nama, email: umat.email }
    });
    
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
    const umat = await Umat.findById(req.params.id);
    
    if (!umat) {
      return res.status(404).json({ message: "Umat not found" });
    }
    
    await Umat.findByIdAndDelete(req.params.id);
    
    await logActivity(req, {
      actionType: 'DELETE',
      entityType: 'UMAT',
      entityId: umat._id,
      entityName: umat.nama,
      description: `Deleted umat: ${umat.nama}`,
      details: { nama: umat.nama, email: umat.email }
    });
    
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