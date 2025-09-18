const Absensi = require("../models/absensi");
const Pendaftaran = require("../models/pendaftaran");
const Umat = require("../models/umat");

exports.scanQRCode = async (req, res) => {
  try {
    const { qrCode, kegiatanId } = req.body;
    
    if (!qrCode || !kegiatanId) {
      return res.status(400).json({ message: "QR Code and kegiatan ID are required" });
    }
    
    const pendaftaran = await Pendaftaran.findOne({ qrCode, kegiatan: kegiatanId });
    if (!pendaftaran) {
      return res.status(404).json({ message: "Invalid QR Code or kegiatan not found" });
    }
    
    const existingAbsensi = await Absensi.findOne({ 
      umat: pendaftaran._id, 
      kegiatan: kegiatanId,
      tanggal: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    
    if (existingAbsensi) {
      return res.status(409).json({ message: "Attendance already recorded for today" });
    }
    
    const absensi = new Absensi({
      umat: pendaftaran._id,
      kegiatan: kegiatanId,
      qrCode
    });
    
    await absensi.save();
    
    res.json({
      message: "Attendance recorded successfully",
      absensi
    });
  } catch (err) {
    res.status(500).json({
      message: "Error recording attendance",
      error: err.message
    });
  }
};

exports.createAbsensi = async (req, res) => {
  try {
    const { umat, kegiatan, status } = req.body;
    
    if (!umat || !kegiatan) {
      return res.status(400).json({ message: "Umat and kegiatan are required" });
    }
    
    const absensi = new Absensi({
      umat,
      kegiatan,
      status: status || 'hadir'
    });
    
    await absensi.save();
    
    res.status(201).json({
      message: "Absensi created successfully",
      absensi
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating absensi",
      error: err.message
    });
  }
};

exports.getAllAbsensi = async (req, res) => {
  try {
    const absensi = await Absensi.find()
      .populate('umat', 'namaLengkap email')
      .populate('kegiatan', 'namaKegiatan')
      .sort({ tanggal: -1 });
    
    res.json(absensi);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching absensi",
      error: err.message
    });
  }
};

exports.getAbsensiByKegiatan = async (req, res) => {
  try {
    const { kegiatanId } = req.params;
    
    const absensi = await Absensi.find({ kegiatan: kegiatanId })
      .populate('umat', 'namaLengkap email')
      .populate('kegiatan', 'namaKegiatan')
      .sort({ tanggal: -1 });
    
    res.json(absensi);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching absensi",
      error: err.message
    });
  }
};

exports.updateAbsensi = async (req, res) => {
  try {
    const { status } = req.body;
    
    const absensi = await Absensi.findById(req.params.id);
    
    if (!absensi) {
      return res.status(404).json({ message: "Absensi not found" });
    }
    
    if (status) absensi.status = status;
    
    await absensi.save();
    
    res.json({
      message: "Absensi updated successfully",
      absensi
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating absensi",
      error: err.message
    });
  }
};

exports.deleteAbsensi = async (req, res) => {
  try {
    const absensi = await Absensi.findByIdAndDelete(req.params.id);
    
    if (!absensi) {
      return res.status(404).json({ message: "Absensi not found" });
    }
    
    res.json({ message: "Absensi deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting absensi",
      error: err.message
    });
  }
};
