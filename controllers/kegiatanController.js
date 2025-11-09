const Kegiatan = require("../models/kegiatan");
const Jadwal = require("../models/jadwal");
const { logActivity } = require("../utils/activityLogger");

exports.createKegiatan = async (req, res) => {
  try {
    const { namaKegiatan, deskripsi, tanggalMulai, tanggalSelesai, waktuMulai, waktuSelesai, tempat, kapasitas, kategori, status } = req.body;
    
    if (!namaKegiatan || !deskripsi || !tanggalMulai || !tanggalSelesai) {
      return res.status(400).json({ message: "Required fields missing" });
    }
    
    const kegiatan = new Kegiatan({
      namaKegiatan,
      deskripsi,
      tanggalMulai,
      tanggalSelesai,
      waktuMulai,
      waktuSelesai,
      tempat,
      kapasitas,
      kategori,
      status: status || 'akan_datang'
    });
    
    await kegiatan.save();
    await kegiatan.populate('kategori');
    
    // Create corresponding jadwal entries for each date in the range
    const startDate = new Date(tanggalMulai);
    const endDate = new Date(tanggalSelesai);
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const jadwal = new Jadwal({
        judul: namaKegiatan,
        deskripsi,
        tanggal: new Date(currentDate),
        waktuMulai,
        waktuSelesai,
        kategori,
        tempat
      });
      await jadwal.save();
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'KEGIATAN',
      entityId: kegiatan._id,
      entityName: kegiatan.namaKegiatan,
      description: `Created new kegiatan: ${kegiatan.namaKegiatan}`,
      details: { 
        namaKegiatan: kegiatan.namaKegiatan, 
        tanggalMulai: kegiatan.tanggalMulai,
        tempat: kegiatan.tempat 
      }
    });
    
    res.status(201).json({
      message: "Kegiatan created successfully",
      kegiatan
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating kegiatan",
      error: err.message
    });
  }
};

exports.getAllKegiatan = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allKegiatan = await Kegiatan.find()
      .populate('kategori')
      .sort({ tanggalMulai: 1 });
    
    const updatedKegiatan = await Promise.all(
      allKegiatan.map(async (item) => {
        if (item.tanggalSelesai && item.status !== 'selesai') {
          const endDate = new Date(item.tanggalSelesai);
          endDate.setHours(0, 0, 0, 0);
          
          if (endDate < today) {
            item.status = 'selesai';
            await item.save();
          }
        }
        return item;
      })
    );
    
    const totalKegiatan = updatedKegiatan.length;
    const totalPages = Math.ceil(totalKegiatan / limit);
    const paginatedKegiatan = updatedKegiatan.slice(skip, skip + limit);
    
    res.json({
      kegiatan: paginatedKegiatan,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalKegiatan: totalKegiatan,
        kegiatanPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching kegiatan",
      error: err.message
    });
  }
};

exports.getKegiatanById = async (req, res) => {
  try {
    const kegiatan = await Kegiatan.findById(req.params.id).populate('kategori');
    
    if (!kegiatan) {
      return res.status(404).json({ message: "Kegiatan not found" });
    }
    
    res.json(kegiatan);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching kegiatan",
      error: err.message
    });
  }
};

exports.updateKegiatan = async (req, res) => {
  try {
    const { namaKegiatan, deskripsi, tanggalMulai, tanggalSelesai, waktuMulai, waktuSelesai, tempat, kapasitas, kategori, status } = req.body;
    
    const kegiatan = await Kegiatan.findById(req.params.id);
    
    if (!kegiatan) {
      return res.status(404).json({ message: "Kegiatan not found" });
    }
    
    if (namaKegiatan) kegiatan.namaKegiatan = namaKegiatan;
    if (deskripsi) kegiatan.deskripsi = deskripsi;
    if (tanggalMulai) kegiatan.tanggalMulai = tanggalMulai;
    if (tanggalSelesai) kegiatan.tanggalSelesai = tanggalSelesai;
    if (waktuMulai !== undefined) kegiatan.waktuMulai = waktuMulai;
    if (waktuSelesai !== undefined) kegiatan.waktuSelesai = waktuSelesai;
    if (tempat) kegiatan.tempat = tempat;
    if (kapasitas) kegiatan.kapasitas = kapasitas;
    if (kategori !== undefined) kegiatan.kategori = kategori;
    if (status) kegiatan.status = status;
    
    await kegiatan.save();
    await kegiatan.populate('kategori');
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'KEGIATAN',
      entityId: kegiatan._id,
      entityName: kegiatan.namaKegiatan,
      description: `Updated kegiatan: ${kegiatan.namaKegiatan}`,
      details: { 
        namaKegiatan: kegiatan.namaKegiatan, 
        tanggalMulai: kegiatan.tanggalMulai,
        tempat: kegiatan.tempat,
        status: kegiatan.status
      }
    });
    
    res.json({
      message: "Kegiatan updated successfully",
      kegiatan
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating kegiatan",
      error: err.message
    });
  }
};

exports.deleteKegiatan = async (req, res) => {
  try {
    const kegiatan = await Kegiatan.findById(req.params.id);
    
    if (!kegiatan) {
      return res.status(404).json({ message: "Kegiatan not found" });
    }
    
    await logActivity(req, {
      actionType: 'DELETE',
      entityType: 'KEGIATAN',
      entityId: kegiatan._id,
      entityName: kegiatan.namaKegiatan,
      description: `Deleted kegiatan: ${kegiatan.namaKegiatan}`,
      details: { 
        namaKegiatan: kegiatan.namaKegiatan, 
        tanggalMulai: kegiatan.tanggalMulai,
        tempat: kegiatan.tempat
      }
    });
    
    await Kegiatan.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Kegiatan deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting kegiatan",
      error: err.message
    });
  }
};

exports.activateKegiatan = async (req, res) => {
  try {
    const kegiatan = await Kegiatan.findById(req.params.id);
    
    if (!kegiatan) {
      return res.status(404).json({ message: "Kegiatan not found" });
    }
    
    if (kegiatan.status !== 'akan_datang') {
      return res.status(400).json({ message: "Only activities with status 'Akan Datang' can be activated" });
    }
    
    kegiatan.status = 'sedang_berlangsung';
    await kegiatan.save();
    await kegiatan.populate('kategori');
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'KEGIATAN',
      entityId: kegiatan._id,
      entityName: kegiatan.namaKegiatan,
      description: `Activated kegiatan: ${kegiatan.namaKegiatan}`,
      details: { 
        namaKegiatan: kegiatan.namaKegiatan, 
        status: kegiatan.status
      }
    });
    
    res.json({
      message: "Kegiatan activated successfully",
      kegiatan
    });
  } catch (err) {
    res.status(500).json({
      message: "Error activating kegiatan",
      error: err.message
    });
  }
};
