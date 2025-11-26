const Struktur = require("../models/struktur");
const { logActivity } = require("../utils/activityLogger");

exports.createStruktur = async (req, res) => {
  try {
    const { nama, jabatan, kontak, periode } = req.body;
    
    if (!nama || !jabatan) {
      return res.status(400).json({ message: "Nama and jabatan are required" });
    }
    
    const struktur = new Struktur({
      nama,
      jabatan,
      kontak,
      periode
    });
    
    await struktur.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'STRUKTUR',
      entityId: struktur._id,
      entityName: struktur.nama,
      description: `Created new struktur: ${struktur.nama}`,
      details: { 
        nama: struktur.nama, 
        jabatan: struktur.jabatan,
        departemen: struktur.departemen
      }
    });
    
    res.status(201).json({
      message: "Struktur created successfully",
      struktur
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating struktur",
      error: err.message
    });
  }
};

exports.getAllStruktur = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const totalStruktur = await Struktur.countDocuments({ status: 'aktif' });
    const totalPages = Math.ceil(totalStruktur / limit);
    
    const struktur = await Struktur.find({ status: 'aktif' })
      .sort({ nama: 1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      struktur,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalStruktur: totalStruktur,
        strukturPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching struktur",
      error: err.message
    });
  }
};

exports.getStrukturById = async (req, res) => {
  try {
    const struktur = await Struktur.findById(req.params.id);
    
    if (!struktur) {
      return res.status(404).json({ message: "Struktur not found" });
    }
    
    res.json(struktur);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching struktur",
      error: err.message
    });
  }
};

exports.updateStruktur = async (req, res) => {
  try {
    const { nama, jabatan, kontak, periode, status } = req.body;
    
    const struktur = await Struktur.findById(req.params.id);
    
    if (!struktur) {
      return res.status(404).json({ message: "Struktur not found" });
    }
    
    const oldData = {
      nama: struktur.nama,
      jabatan: struktur.jabatan,
      status: struktur.status
    };
    
    if (nama) struktur.nama = nama;
    if (jabatan) struktur.jabatan = jabatan;
    if (kontak !== undefined) struktur.kontak = kontak;
    if (periode !== undefined) struktur.periode = periode;
    if (status) struktur.status = status;
    
    await struktur.save();
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'STRUKTUR',
      entityId: struktur._id,
      entityName: struktur.nama,
      description: `Updated struktur: ${oldData.nama}`,
      details: { 
        oldData,
        newData: {
          nama: struktur.nama,
          jabatan: struktur.jabatan,
          status: struktur.status
        }
      }
    });
    
    res.json({
      message: "Struktur updated successfully",
      struktur
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating struktur",
      error: err.message
    });
  }
};

exports.deleteStruktur = async (req, res) => {
  try {
    const struktur = await Struktur.findById(req.params.id);
    
    if (!struktur) {
      return res.status(404).json({ message: "Struktur not found" });
    }
    
    await logActivity(req, {
      actionType: 'DELETE',
      entityType: 'STRUKTUR',
      entityId: struktur._id,
      entityName: struktur.nama,
      description: `Deleted struktur: ${struktur.nama}`,
      details: { 
        nama: struktur.nama,
        jabatan: struktur.jabatan,
        status: struktur.status
      }
    });
    
    await Struktur.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Struktur deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting struktur",
      error: err.message
    });
  }
};
