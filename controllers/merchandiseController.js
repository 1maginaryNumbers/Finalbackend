const Merchandise = require("../models/merchandise");
const { logActivity } = require("../utils/activityLogger");

exports.createMerchandise = async (req, res) => {
  try {
    const { nama, harga, deskripsi, stok } = req.body;
    
    if (!nama || !harga) {
      return res.status(400).json({ message: "Nama and harga are required" });
    }
    
    const merchandise = new Merchandise({
      nama,
      harga,
      deskripsi,
      stok,
      gambar: req.file ? `/uploads/merchandise/${req.file.filename}` : undefined
    });
    
    await merchandise.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'MERCHANDISE',
      entityId: merchandise._id,
      entityName: merchandise.nama,
      description: `Created new merchandise: ${merchandise.nama}`,
      details: { 
        nama: merchandise.nama, 
        harga: merchandise.harga,
        stok: merchandise.stok
      }
    });
    
    res.status(201).json({
      message: "Merchandise created successfully",
      merchandise
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating merchandise",
      error: err.message
    });
  }
};

exports.getAllMerchandise = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const totalMerchandise = await Merchandise.countDocuments();
    const totalPages = Math.ceil(totalMerchandise / limit);
    
    const merchandise = await Merchandise.find()
      .sort({ nama: 1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      merchandise,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalMerchandise: totalMerchandise,
        merchandisePerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching merchandise",
      error: err.message
    });
  }
};

exports.getMerchandiseById = async (req, res) => {
  try {
    const merchandise = await Merchandise.findById(req.params.id);
    
    if (!merchandise) {
      return res.status(404).json({ message: "Merchandise not found" });
    }
    
    res.json(merchandise);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching merchandise",
      error: err.message
    });
  }
};

exports.updateMerchandise = async (req, res) => {
  try {
    const { nama, harga, deskripsi, stok, status } = req.body;
    
    const merchandise = await Merchandise.findById(req.params.id);
    
    if (!merchandise) {
      return res.status(404).json({ message: "Merchandise not found" });
    }
    
    if (nama) merchandise.nama = nama;
    if (harga) merchandise.harga = harga;
    if (deskripsi) merchandise.deskripsi = deskripsi;
    if (stok !== undefined) merchandise.stok = stok;
    if (status) merchandise.status = status;
    
    // Handle image upload
    if (req.file) {
      merchandise.gambar = `/uploads/merchandise/${req.file.filename}`;
    }
    
    await merchandise.save();
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'MERCHANDISE',
      entityId: merchandise._id,
      entityName: merchandise.nama,
      description: `Updated merchandise: ${merchandise.nama}`,
      details: { 
        nama: merchandise.nama, 
        harga: merchandise.harga,
        stok: merchandise.stok,
        status: merchandise.status
      }
    });
    
    res.json({
      message: "Merchandise updated successfully",
      merchandise
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating merchandise",
      error: err.message
    });
  }
};

exports.deleteMerchandise = async (req, res) => {
  try {
    const merchandise = await Merchandise.findById(req.params.id);
    
    if (!merchandise) {
      return res.status(404).json({ message: "Merchandise not found" });
    }
    
    await logActivity(req, {
      actionType: 'DELETE',
      entityType: 'MERCHANDISE',
      entityId: merchandise._id,
      entityName: merchandise.nama,
      description: `Deleted merchandise: ${merchandise.nama}`,
      details: { 
        nama: merchandise.nama, 
        harga: merchandise.harga,
        stok: merchandise.stok
      }
    });
    
    await Merchandise.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Merchandise deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting merchandise",
      error: err.message
    });
  }
};
