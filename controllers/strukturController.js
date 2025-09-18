const Struktur = require("../models/struktur");

exports.createStruktur = async (req, res) => {
  try {
    const { nama, jabatan, foto, kontak, urutan } = req.body;
    
    if (!nama || !jabatan) {
      return res.status(400).json({ message: "Nama and jabatan are required" });
    }
    
    const struktur = new Struktur({
      nama,
      jabatan,
      foto,
      kontak,
      urutan
    });
    
    await struktur.save();
    
    res.status(201).json({
      message: "Struktur created successfully",
      struktur
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating struktur",
      error: err.message
    });
  }
};

exports.getAllStruktur = async (req, res) => {
  try {
    const struktur = await Struktur.find({ status: 'aktif' }).sort({ urutan: 1 });
    res.json(struktur);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching struktur",
      error: err.message
    });
  }
};

exports.getStrukturById = async (req, res) => {
  try {
    const struktur = await Struktur.findById(req.params.id);
    
    if (!struktur) {
      return res.status(404).json({ message: "Struktur not found" });
    }
    
    res.json(struktur);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching struktur",
      error: err.message
    });
  }
};

exports.updateStruktur = async (req, res) => {
  try {
    const { nama, jabatan, foto, kontak, urutan, status } = req.body;
    
    const struktur = await Struktur.findById(req.params.id);
    
    if (!struktur) {
      return res.status(404).json({ message: "Struktur not found" });
    }
    
    if (nama) struktur.nama = nama;
    if (jabatan) struktur.jabatan = jabatan;
    if (foto) struktur.foto = foto;
    if (kontak) struktur.kontak = kontak;
    if (urutan !== undefined) struktur.urutan = urutan;
    if (status) struktur.status = status;
    
    await struktur.save();
    
    res.json({
      message: "Struktur updated successfully",
      struktur
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating struktur",
      error: err.message
    });
  }
};

exports.deleteStruktur = async (req, res) => {
  try {
    const struktur = await Struktur.findByIdAndDelete(req.params.id);
    
    if (!struktur) {
      return res.status(404).json({ message: "Struktur not found" });
    }
    
    res.json({ message: "Struktur deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting struktur",
      error: err.message
    });
  }
};
