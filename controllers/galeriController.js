const Galeri = require("../models/galeri");
const path = require('path');

exports.createGaleri = async (req, res) => {
  try {
    const { judul, deskripsi, kategori } = req.body;
    
    if (!judul) {
      return res.status(400).json({ message: "Judul is required" });
    }
    
    let imageUrl = '';
    
    if (req.file) {
      imageUrl = `/uploads/galeri/${req.file.filename}`;
    } else if (req.body.url) {
      imageUrl = req.body.url;
    } else {
      return res.status(400).json({ message: "Either image file or URL is required" });
    }
    
    const galeri = new Galeri({
      judul,
      url: imageUrl,
      deskripsi,
      kategori: kategori || 'umum'
    });
    
    await galeri.save();
    
    res.status(201).json({
      message: "Galeri created successfully",
      galeri
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating galeri",
      error: err.message
    });
  }
};

exports.getAllGaleri = async (req, res) => {
  try {
    const galeri = await Galeri.find().sort({ tanggalUpload: -1 });
    
    const uniqueKategoris = [...new Set(galeri.map(item => item.kategori))];
    console.log(`📊 Total gallery items: ${galeri.length}`);
    console.log(`🏷️  Available kategoris: ${uniqueKategoris.join(', ')}`);
    
    res.json(galeri);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching galeri",
      error: err.message
    });
  }
};

exports.getGaleriById = async (req, res) => {
  try {
    const galeri = await Galeri.findById(req.params.id);
    
    if (!galeri) {
      return res.status(404).json({ message: "Galeri not found" });
    }
    
    res.json(galeri);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching galeri",
      error: err.message
    });
  }
};

exports.getGaleriByKategori = async (req, res) => {
  try {
    const { kategori } = req.params;
    
    console.log(`🔍 Searching for kategori: "${kategori}"`);
    
    const galeri = await Galeri.find({ 
      kategori: { $regex: kategori, $options: 'i' } 
    }).sort({ tanggalUpload: -1 });
    
    console.log(`📊 Found ${galeri.length} items for kategori "${kategori}"`);
    
    res.json(galeri);
  } catch (err) {
    console.error('❌ Error in getGaleriByKategori:', err.message);
    res.status(500).json({
      message: "Error fetching galeri",
      error: err.message
    });
  }
};

exports.updateGaleri = async (req, res) => {
  try {
    const { judul, url, deskripsi, kategori } = req.body;
    
    const galeri = await Galeri.findById(req.params.id);
    
    if (!galeri) {
      return res.status(404).json({ message: "Galeri not found" });
    }
    
    if (judul) galeri.judul = judul;
    if (url) galeri.url = url;
    if (deskripsi) galeri.deskripsi = deskripsi;
    if (kategori) galeri.kategori = kategori;
    
    await galeri.save();
    
    res.json({
      message: "Galeri updated successfully",
      galeri
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating galeri",
      error: err.message
    });
  }
};

exports.getGaleriKategoris = async (req, res) => {
  try {
    const galeri = await Galeri.find({}, 'kategori');
    const uniqueKategoris = [...new Set(galeri.map(item => item.kategori))];
    
    res.json({
      kategoris: uniqueKategoris,
      total: uniqueKategoris.length
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching kategoris",
      error: err.message
    });
  }
};

exports.deleteGaleri = async (req, res) => {
  try {
    const galeri = await Galeri.findByIdAndDelete(req.params.id);
    
    if (!galeri) {
      return res.status(404).json({ message: "Galeri not found" });
    }
    
    res.json({ message: "Galeri deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting galeri",
      error: err.message
    });
  }
};
