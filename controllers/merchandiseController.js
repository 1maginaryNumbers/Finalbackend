const Merchandise = require("../models/merchandise");

exports.createMerchandise = async (req, res) => {
  try {
    const { nama, harga, deskripsi, stok, kategori, gambar } = req.body;
    
    if (!nama || !harga) {
      return res.status(400).json({ message: "Nama and harga are required" });
    }
    
    const merchandise = new Merchandise({
      nama,
      harga,
      deskripsi,
      stok,
      kategori,
      gambar
    });
    
    await merchandise.save();
    
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
    const merchandise = await Merchandise.find().sort({ nama: 1 });
    res.json(merchandise);
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

exports.getMerchandiseByKategori = async (req, res) => {
  try {
    const { kategori } = req.params;
    
    const merchandise = await Merchandise.find({ kategori }).sort({ nama: 1 });
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
    const { nama, harga, deskripsi, stok, kategori, gambar, status } = req.body;
    
    const merchandise = await Merchandise.findById(req.params.id);
    
    if (!merchandise) {
      return res.status(404).json({ message: "Merchandise not found" });
    }
    
    if (nama) merchandise.nama = nama;
    if (harga) merchandise.harga = harga;
    if (deskripsi) merchandise.deskripsi = deskripsi;
    if (stok !== undefined) merchandise.stok = stok;
    if (kategori) merchandise.kategori = kategori;
    if (gambar) merchandise.gambar = gambar;
    if (status) merchandise.status = status;
    
    await merchandise.save();
    
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
    const merchandise = await Merchandise.findByIdAndDelete(req.params.id);
    
    if (!merchandise) {
      return res.status(404).json({ message: "Merchandise not found" });
    }
    
    res.json({ message: "Merchandise deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting merchandise",
      error: err.message
    });
  }
};
