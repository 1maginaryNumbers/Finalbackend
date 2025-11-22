const KategoriJadwal = require("../models/kategoriJadwal");
const { logActivity } = require("../utils/activityLogger");

exports.createKategori = async (req, res) => {
  try {
    const { nama, warna } = req.body;
    
    if (!nama) {
      return res.status(400).json({ message: "Nama kategori is required" });
    }
    
    const kategori = new KategoriJadwal({
      nama,
      warna: warna || '#3b82f6'
    });
    
    await kategori.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'KATEGORI_JADWAL',
      entityId: kategori._id,
      entityName: kategori.nama,
      description: `Created new category: ${kategori.nama}`,
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
    const kategori = await KategoriJadwal.find().sort({ nama: 1 });
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
    
    const kategori = await KategoriJadwal.findById(req.params.id);
    
    if (!kategori) {
      return res.status(404).json({ message: "Kategori not found" });
    }
    
    const oldNama = kategori.nama;
    const oldWarna = kategori.warna;
    
    if (nama) kategori.nama = nama;
    if (warna) kategori.warna = warna;
    
    await kategori.save();
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'KATEGORI_JADWAL',
      entityId: kategori._id,
      entityName: kategori.nama,
      description: `Updated category: ${oldNama}`,
      details: { 
        oldNama,
        newNama: kategori.nama,
        oldWarna,
        newWarna: kategori.warna
      }
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
    const kategori = await KategoriJadwal.findById(req.params.id);
    
    if (!kategori) {
      return res.status(404).json({ message: "Kategori not found" });
    }
    
    await logActivity(req, {
      actionType: 'DELETE',
      entityType: 'KATEGORI_JADWAL',
      entityId: kategori._id,
      entityName: kategori.nama,
      description: `Deleted category: ${kategori.nama}`,
      details: { 
        nama: kategori.nama,
        warna: kategori.warna
      }
    });
    
    await KategoriJadwal.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Kategori deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting kategori",
      error: err.message
    });
  }
};

