const Kegiatan = require("../models/kegiatan");

exports.createKegiatan = async (req, res) => {
  try {
    const { namaKegiatan, deskripsi, tanggalMulai, tanggalSelesai, waktu, tempat, kapasitas, status } = req.body;
    
    if (!namaKegiatan || !deskripsi || !tanggalMulai || !tanggalSelesai) {
      return res.status(400).json({ message: "Required fields missing" });
    }
    
    const kegiatan = new Kegiatan({
      namaKegiatan,
      deskripsi,
      tanggalMulai,
      tanggalSelesai,
      waktu,
      tempat,
      kapasitas,
      status: status || 'akan_datang'
    });
    
    await kegiatan.save();
    
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
    const kegiatan = await Kegiatan.find().sort({ tanggalMulai: 1 });
    res.json(kegiatan);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching kegiatan",
      error: err.message
    });
  }
};

exports.getKegiatanById = async (req, res) => {
  try {
    const kegiatan = await Kegiatan.findById(req.params.id);
    
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
    const { namaKegiatan, deskripsi, tanggalMulai, tanggalSelesai, waktu, tempat, kapasitas, status } = req.body;
    
    const kegiatan = await Kegiatan.findById(req.params.id);
    
    if (!kegiatan) {
      return res.status(404).json({ message: "Kegiatan not found" });
    }
    
    if (namaKegiatan) kegiatan.namaKegiatan = namaKegiatan;
    if (deskripsi) kegiatan.deskripsi = deskripsi;
    if (tanggalMulai) kegiatan.tanggalMulai = tanggalMulai;
    if (tanggalSelesai) kegiatan.tanggalSelesai = tanggalSelesai;
    if (waktu) kegiatan.waktu = waktu;
    if (tempat) kegiatan.tempat = tempat;
    if (kapasitas) kegiatan.kapasitas = kapasitas;
    if (status) kegiatan.status = status;
    
    await kegiatan.save();
    
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
    const kegiatan = await Kegiatan.findByIdAndDelete(req.params.id);
    
    if (!kegiatan) {
      return res.status(404).json({ message: "Kegiatan not found" });
    }
    
    res.json({ message: "Kegiatan deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting kegiatan",
      error: err.message
    });
  }
};
