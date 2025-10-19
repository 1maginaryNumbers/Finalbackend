const Pengumuman = require("../models/pengumuman");
const { logActivity } = require("../utils/activityLogger");

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
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'PENGUMUMAN',
      entityId: pengumuman._id,
      entityName: pengumuman.judul,
      description: `Created new pengumuman: ${pengumuman.judul}`,
      details: { 
        judul: pengumuman.judul, 
        penulis: req.admin ? req.admin.username : 'Unknown'
      }
    });
    
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const totalPengumuman = await Pengumuman.countDocuments();
    const totalPages = Math.ceil(totalPengumuman / limit);
    
    const pengumuman = await Pengumuman.find()
      .populate('penulis', 'username')
      .sort({ tanggalPublikasi: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      pengumuman,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalPengumuman: totalPengumuman,
        pengumumanPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
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
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'PENGUMUMAN',
      entityId: pengumuman._id,
      entityName: pengumuman.judul,
      description: `Updated pengumuman: ${pengumuman.judul}`,
      details: { 
        judul: pengumuman.judul, 
        penulis: req.admin ? req.admin.username : 'Unknown'
      }
    });
    
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
    const pengumuman = await Pengumuman.findById(req.params.id);
    
    if (!pengumuman) {
      return res.status(404).json({ message: "Pengumuman not found" });
    }
    
    await logActivity(req, {
      actionType: 'DELETE',
      entityType: 'PENGUMUMAN',
      entityId: pengumuman._id,
      entityName: pengumuman.judul,
      description: `Deleted pengumuman: ${pengumuman.judul}`,
      details: { 
        judul: pengumuman.judul, 
        penulis: req.admin ? req.admin.username : 'Unknown'
      }
    });
    
    await Pengumuman.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Pengumuman deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting pengumuman",
      error: err.message
    });
  }
};
