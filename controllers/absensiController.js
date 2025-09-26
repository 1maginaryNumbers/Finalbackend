const Absensi = require("../models/absensi");
const Pendaftaran = require("../models/pendaftaran");
const Umat = require("../models/umat");

exports.scanQRCode = async (req, res) => {
  try {
    const { qrCodeData, kegiatanId } = req.body;
    
    if (!qrCodeData || !kegiatanId) {
      return res.status(400).json({ message: "QR Code data and kegiatan ID are required" });
    }
    
    const pendaftaran = await Pendaftaran.findOne({ 
      qrCodeData: qrCodeData,
      kegiatan: kegiatanId 
    }).populate('kegiatan');
    
    if (!pendaftaran) {
      return res.status(404).json({ message: "Invalid QR Code or kegiatan not found" });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let existingAbsensi = await Absensi.findOne({ 
      pendaftaran: pendaftaran._id, 
      kegiatan: kegiatanId,
      tanggal: { $gte: today, $lt: tomorrow }
    });
    
    if (existingAbsensi) {
      if (existingAbsensi.status === 'hadir') {
        return res.status(409).json({ 
          message: "Attendance already recorded for today",
          absensi: existingAbsensi,
          pendaftaran: pendaftaran
        });
      } else {
        existingAbsensi.status = 'hadir';
        existingAbsensi.tanggal = new Date();
        await existingAbsensi.save();
        
        return res.json({
          message: "Attendance status updated successfully",
          absensi: existingAbsensi,
          pendaftaran: pendaftaran
        });
      }
    }
    
    const absensi = new Absensi({
      pendaftaran: pendaftaran._id,
      kegiatan: kegiatanId,
      status: 'hadir',
      tipePerson: pendaftaran.tipePerson,
      qrCode: qrCodeData
    });
    
    await absensi.save();
    
    res.json({
      message: "Attendance recorded successfully",
      absensi: absensi,
      pendaftaran: pendaftaran
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
    const { pendaftaran, kegiatan, status, tipePerson } = req.body;
    
    if (!pendaftaran || !kegiatan) {
      return res.status(400).json({ message: "Pendaftaran and kegiatan are required" });
    }
    
    const pendaftaranData = await Pendaftaran.findById(pendaftaran);
    if (!pendaftaranData) {
      return res.status(404).json({ message: "Pendaftaran not found" });
    }
    
    if (pendaftaranData.kegiatan.toString() !== kegiatan) {
      return res.status(400).json({ 
        message: "Selected pendaftaran is not registered for the selected kegiatan" 
      });
    }
    
    const existingAbsensi = await Absensi.findOne({
      pendaftaran,
      kegiatan,
      tanggal: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    
    if (existingAbsensi) {
      return res.status(409).json({ 
        message: "Attendance already recorded for this person and kegiatan today" 
      });
    }
    
    const absensi = new Absensi({
      pendaftaran,
      kegiatan,
      status: status || 'hadir',
      tipePerson: tipePerson || pendaftaranData.tipePerson || 'external'
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
      .populate('pendaftaran', 'namaLengkap email namaKegiatan tipePerson')
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
      .populate('pendaftaran', 'namaLengkap email namaKegiatan tipePerson')
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
    const { status, tipePerson } = req.body;
    
    const absensi = await Absensi.findById(req.params.id);
    
    if (!absensi) {
      return res.status(404).json({ message: "Absensi not found" });
    }
    
    if (status) absensi.status = status;
    if (tipePerson) absensi.tipePerson = tipePerson;
    
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
