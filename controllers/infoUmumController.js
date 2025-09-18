const InfoUmum = require("../models/infoUmum");

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
    const { judul, isi, jamBuka, alamat, telepon, email, website } = req.body;
    
    let infoUmum = await InfoUmum.findOne();
    
    if (!infoUmum) {
      infoUmum = new InfoUmum();
    }
    
    if (judul) infoUmum.judul = judul;
    if (isi) infoUmum.isi = isi;
    if (jamBuka) infoUmum.jamBuka = jamBuka;
    if (alamat) infoUmum.alamat = alamat;
    if (telepon) infoUmum.telepon = telepon;
    if (email) infoUmum.email = email;
    if (website) infoUmum.website = website;
    
    infoUmum.tanggalUpdate = new Date();
    
    await infoUmum.save();
    
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
