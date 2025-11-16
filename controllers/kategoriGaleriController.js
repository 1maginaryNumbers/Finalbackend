const KategoriGaleri = require("../models/kategoriGaleri");
const { logActivity } = require("../utils/activityLogger");

exports.createKategori = async (req, res) => {
  try {
    const { nama, warna } = req.body;
    
    if (!nama) {
      return res.status(400).json({ message: "Nama kategori is required" });
    }
    
    const kategori = new KategoriGaleri({
      nama,
      warna: warna || '#3b82f6'
    });
    
    await kategori.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'KATEGORI_GALERI',
      entityId: kategori._id,
      entityName: kategori.nama,
      description: `Created new gallery category: ${kategori.nama}`,
      details: { nama: kategori.nama, warna: kategori.warna }
    });
    
    res.status(201).json({
      message: "Kategori created successfully",
      kategori
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Kategori name already exists" });
    }
    res.status(500).json({
      message: "Error creating kategori",
      error: err.message
    });
  }
};

exports.getAllKategori = async (req, res) => {
  try {
    const kategori = await KategoriGaleri.find().sort({ nama: 1 });
    res.json(kategori);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching kategori",
      error: err.message
    });
  }
};

exports.updateKategori = async (req, res) => {
  try {
    const { nama, warna } = req.body;
    
    const kategori = await KategoriGaleri.findById(req.params.id);
    
    if (!kategori) {
      return res.status(404).json({ message: "Kategori not found" });
    }
    
    if (nama) kategori.nama = nama;
    if (warna) kategori.warna = warna;
    
    await kategori.save();
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'KATEGORI_GALERI',
      entityId: kategori._id,
      entityName: kategori.nama,
      description: `Updated gallery category: ${kategori.nama}`,
      details: { nama: kategori.nama, warna: kategori.warna }
    });
    
    res.json({
      message: "Kategori updated successfully",
      kategori
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Kategori name already exists" });
    }
    res.status(500).json({
      message: "Error updating kategori",
      error: err.message
    });
  }
};

exports.deleteKategori = async (req, res) => {
  try {
    const kategori = await KategoriGaleri.findById(req.params.id);
    
    if (!kategori) {
      return res.status(404).json({ message: "Kategori not found" });
    }
    
    await logActivity(req, {
      actionType: 'DELETE',
      entityType: 'KATEGORI_GALERI',
      entityId: kategori._id,
      entityName: kategori.nama,
      description: `Deleted gallery category: ${kategori.nama}`,
      details: { nama: kategori.nama, warna: kategori.warna }
    });
    
    await KategoriGaleri.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Kategori deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting kategori",
      error: err.message
    });
  }
};

