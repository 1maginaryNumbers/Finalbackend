const InfoUmum = require("../models/infoUmum");
const { logActivity } = require("../utils/activityLogger");

exports.getInfoUmum = async (req, res) => {
  try {
    let infoUmum = await InfoUmum.findOne();
    
    if (!infoUmum) {
      infoUmum = new InfoUmum({
        judul: "Informasi Umum Vihara",
        isi: "Selamat datang di Vihara kami"
      });
      await infoUmum.save();
    }
    
    res.json(infoUmum);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching info umum",
      error: err.message
    });
  }
};

exports.updateInfoUmum = async (req, res) => {
  try {
    const { judul, isi, alamat, telepon, email, sejarah, visi, misi, jamOperasional, tanggalKhusus } = req.body;
    
    let infoUmum = await InfoUmum.findOne();
    
    if (!infoUmum) {
      infoUmum = new InfoUmum();
    }
    
    if (judul !== undefined) infoUmum.judul = judul;
    if (isi !== undefined) infoUmum.isi = isi;
    if (alamat !== undefined) infoUmum.alamat = alamat;
    if (telepon !== undefined) infoUmum.telepon = telepon;
    if (email !== undefined) infoUmum.email = email;
    if (sejarah !== undefined) infoUmum.sejarah = sejarah;
    if (visi !== undefined) infoUmum.visi = visi;
    if (misi !== undefined) infoUmum.misi = misi;
    if (jamOperasional !== undefined && Array.isArray(jamOperasional)) {
      infoUmum.jamOperasional = jamOperasional;
    }
    if (tanggalKhusus !== undefined && Array.isArray(tanggalKhusus)) {
      infoUmum.tanggalKhusus = tanggalKhusus;
    }
    
    infoUmum.tanggalUpdate = new Date();
    
    await infoUmum.save();
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'SYSTEM',
      entityId: infoUmum._id,
      entityName: 'Info Umum',
      description: 'Updated general information',
      details: { 
        judul: infoUmum.judul,
        updatedFields: Object.keys(req.body)
      }
    });
    
    res.json({
      message: "Info umum updated successfully",
      infoUmum
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating info umum",
      error: err.message
    });
  }
};
