const Jadwal = require("../models/jadwal");
const Kegiatan = require("../models/kegiatan");
const { logActivity } = require("../utils/activityLogger");

exports.createJadwal = async (req, res) => {
  try {
    const { judul, deskripsi, tanggal, waktuMulai, waktuSelesai, kategori, tempat, kapasitas } = req.body;
    
    if (!judul || !tanggal) {
      return res.status(400).json({ message: "Judul and tanggal are required" });
    }
    
    const jadwal = new Jadwal({
      judul,
      deskripsi,
      tanggal: new Date(tanggal),
      waktuMulai,
      waktuSelesai,
      kategori,
      tempat,
      kapasitas
    });
    
    await jadwal.save();
    await jadwal.populate('kategori');
    
    // Create corresponding kegiatan with status "akan_datang"
    const kegiatanDate = new Date(tanggal);
    const kegiatan = new Kegiatan({
      namaKegiatan: judul,
      deskripsi: deskripsi || '',
      tanggalMulai: kegiatanDate,
      tanggalSelesai: kegiatanDate,
      waktuMulai,
      waktuSelesai,
      tempat,
      kapasitas,
      kategori,
      status: 'akan_datang'
    });
    
    await kegiatan.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'JADWAL',
      entityId: jadwal._id,
      entityName: jadwal.judul,
      description: `Created new schedule: ${jadwal.judul}`,
      details: { judul: jadwal.judul, tanggal: jadwal.tanggal }
    });
    
    res.status(201).json({
      message: "Jadwal created successfully",
      jadwal
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating jadwal",
      error: err.message
    });
  }
};

exports.getAllJadwal = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let query = {};
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.tanggal = { $gte: startDate, $lte: endDate };
    }
    
    const jadwal = await Jadwal.find(query)
      .populate('kategori')
      .sort({ tanggal: 1, waktuMulai: 1 });
    
    res.json(jadwal);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching jadwal",
      error: err.message
    });
  }
};

exports.getJadwalById = async (req, res) => {
  try {
    const jadwal = await Jadwal.findById(req.params.id).populate('kategori');
    
    if (!jadwal) {
      return res.status(404).json({ message: "Jadwal not found" });
    }
    
    res.json(jadwal);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching jadwal",
      error: err.message
    });
  }
};

exports.updateJadwal = async (req, res) => {
  try {
    const { judul, deskripsi, tanggal, waktuMulai, waktuSelesai, kategori, tempat, kapasitas } = req.body;
    
    const jadwal = await Jadwal.findById(req.params.id);
    
    if (!jadwal) {
      return res.status(404).json({ message: "Jadwal not found" });
    }
    
    if (judul) jadwal.judul = judul;
    if (deskripsi !== undefined) jadwal.deskripsi = deskripsi;
    if (tanggal) jadwal.tanggal = new Date(tanggal);
    if (waktuMulai !== undefined) jadwal.waktuMulai = waktuMulai;
    if (waktuSelesai !== undefined) jadwal.waktuSelesai = waktuSelesai;
    if (kategori !== undefined) jadwal.kategori = kategori;
    if (tempat !== undefined) jadwal.tempat = tempat;
    if (kapasitas !== undefined) jadwal.kapasitas = kapasitas;
    jadwal.updatedAt = new Date();
    
    await jadwal.save();
    await jadwal.populate('kategori');
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'JADWAL',
      entityId: jadwal._id,
      entityName: jadwal.judul,
      description: `Updated schedule: ${jadwal.judul}`,
      details: { judul: jadwal.judul, tanggal: jadwal.tanggal }
    });
    
    res.json({
      message: "Jadwal updated successfully",
      jadwal
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating jadwal",
      error: err.message
    });
  }
};

exports.deleteJadwal = async (req, res) => {
  try {
    const jadwal = await Jadwal.findById(req.params.id);
    
    if (!jadwal) {
      return res.status(404).json({ message: "Jadwal not found" });
    }
    
    await logActivity(req, {
      actionType: 'DELETE',
      entityType: 'JADWAL',
      entityId: jadwal._id,
      entityName: jadwal.judul,
      description: `Deleted schedule: ${jadwal.judul}`,
      details: { judul: jadwal.judul, tanggal: jadwal.tanggal }
    });
    
    await Jadwal.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Jadwal deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting jadwal",
      error: err.message
    });
  }
};

