const Sumbangan = require("../models/sumbangan");
const Transaksi = require("../models/transaksi");

exports.createSumbangan = async (req, res) => {
  try {
    const { namaPaket, deskripsi, targetDana, tanggalSelesai } = req.body;
    
    if (!namaPaket || !targetDana) {
      return res.status(400).json({ message: "Nama paket and target dana are required" });
    }
    
    const sumbangan = new Sumbangan({
      namaPaket,
      deskripsi,
      targetDana,
      tanggalSelesai
    });
    
    await sumbangan.save();
    
    res.status(201).json({
      message: "Sumbangan created successfully",
      sumbangan
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating sumbangan",
      error: err.message
    });
  }
};

exports.getAllSumbangan = async (req, res) => {
  try {
    const sumbangan = await Sumbangan.find({ status: 'aktif' }).sort({ tanggalMulai: -1 });
    res.json(sumbangan);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching sumbangan",
      error: err.message
    });
  }
};

exports.getSumbanganById = async (req, res) => {
  try {
    const sumbangan = await Sumbangan.findById(req.params.id);
    
    if (!sumbangan) {
      return res.status(404).json({ message: "Sumbangan not found" });
    }
    
    res.json(sumbangan);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching sumbangan",
      error: err.message
    });
  }
};

exports.updateSumbangan = async (req, res) => {
  try {
    const { namaPaket, deskripsi, targetDana, danaTerkumpul, status, tanggalSelesai } = req.body;
    
    const sumbangan = await Sumbangan.findById(req.params.id);
    
    if (!sumbangan) {
      return res.status(404).json({ message: "Sumbangan not found" });
    }
    
    if (namaPaket) sumbangan.namaPaket = namaPaket;
    if (deskripsi) sumbangan.deskripsi = deskripsi;
    if (targetDana) sumbangan.targetDana = targetDana;
    if (danaTerkumpul !== undefined) sumbangan.danaTerkumpul = danaTerkumpul;
    if (status) sumbangan.status = status;
    if (tanggalSelesai) sumbangan.tanggalSelesai = tanggalSelesai;
    
    await sumbangan.save();
    
    res.json({
      message: "Sumbangan updated successfully",
      sumbangan
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating sumbangan",
      error: err.message
    });
  }
};

exports.deleteSumbangan = async (req, res) => {
  try {
    const sumbangan = await Sumbangan.findByIdAndDelete(req.params.id);
    
    if (!sumbangan) {
      return res.status(404).json({ message: "Sumbangan not found" });
    }
    
    res.json({ message: "Sumbangan deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting sumbangan",
      error: err.message
    });
  }
};

exports.createTransaksi = async (req, res) => {
  try {
    const { sumbangan, namaDonatur, email, nominal, metodePembayaran, buktiPembayaran } = req.body;
    
    if (!sumbangan || !namaDonatur || !nominal) {
      return res.status(400).json({ message: "Sumbangan, nama donatur, and nominal are required" });
    }
    
    const sumbanganExists = await Sumbangan.findById(sumbangan);
    if (!sumbanganExists) {
      return res.status(404).json({ message: "Sumbangan not found" });
    }
    
    const transaksi = new Transaksi({
      sumbangan,
      namaDonatur,
      email,
      nominal,
      metodePembayaran,
      buktiPembayaran
    });
    
    await transaksi.save();
    
    res.status(201).json({
      message: "Transaksi created successfully",
      transaksi
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating transaksi",
      error: err.message
    });
  }
};

exports.getAllTransaksi = async (req, res) => {
  try {
    const transaksi = await Transaksi.find()
      .populate('sumbangan', 'namaPaket')
      .sort({ tanggalTransaksi: -1 });
    res.json(transaksi);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching transaksi",
      error: err.message
    });
  }
};

exports.updateTransaksiStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const transaksi = await Transaksi.findById(req.params.id);
    
    if (!transaksi) {
      return res.status(404).json({ message: "Transaksi not found" });
    }
    
    if (status) transaksi.status = status;
    
    await transaksi.save();
    
    res.json({
      message: "Transaksi status updated successfully",
      transaksi
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating transaksi status",
      error: err.message
    });
  }
};
