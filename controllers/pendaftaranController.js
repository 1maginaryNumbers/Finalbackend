const Pendaftaran = require("../models/pendaftaran");
const Kegiatan = require("../models/kegiatan");
const crypto = require("crypto");
const QRCode = require("qrcode");

exports.createPendaftaran = async (req, res) => {
  try {
    const { kegiatan, namaLengkap, email, nomorTelepon, tipePerson } = req.body;
    
    if (!kegiatan || !namaLengkap || !email || !nomorTelepon) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    const kegiatanExists = await Kegiatan.findById(kegiatan);
    if (!kegiatanExists) {
      return res.status(404).json({ message: "Kegiatan not found" });
    }
    
    const qrCodeData = crypto.randomBytes(16).toString('hex');
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);
    
    const pendaftaran = new Pendaftaran({
      kegiatan,
      namaKegiatan: kegiatanExists.namaKegiatan,
      namaLengkap,
      email,
      nomorTelepon,
      tipePerson: tipePerson || 'external',
      qrCode: qrCodeImage,
      qrCodeData: qrCodeData
    });
    
    await pendaftaran.save();
    
    res.status(201).json({
      message: "Pendaftaran successful",
      pendaftaran
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating pendaftaran",
      error: err.message
    });
  }
};

exports.daftarKegiatan = async (req, res) => {
  try {
    const { kegiatanId } = req.params;
    const { peserta } = req.body;
    
    if (!peserta) {
      return res.status(400).json({ message: "Peserta data is required" });
    }
    
    const kegiatanExists = await Kegiatan.findById(kegiatanId);
    if (!kegiatanExists) {
      return res.status(404).json({ message: "Kegiatan not found" });
    }
    
    const results = [];
    const errors = [];
    
    if (Array.isArray(peserta)) {
      for (const p of peserta) {
        try {
          if (!p.namaLengkap || !p.email || !p.nomorTelepon) {
            errors.push({ 
              peserta: p, 
              error: "Nama lengkap, email, and nomor telepon are required" 
            });
            continue;
          }
          
          const existingPendaftaran = await Pendaftaran.findOne({
            kegiatan: kegiatanId,
            email: p.email
          });
          
          if (existingPendaftaran) {
            errors.push({ 
              peserta: p, 
              error: "Email already registered for this kegiatan" 
            });
            continue;
          }
          
          const qrCode = crypto.randomBytes(16).toString('hex');
          
          const pendaftaran = new Pendaftaran({
            kegiatan: kegiatanId,
            namaKegiatan: kegiatanExists.namaKegiatan,
            namaLengkap: p.namaLengkap,
            email: p.email,
            nomorTelepon: p.nomorTelepon,
            tipePerson: p.tipePerson || 'external',
            qrCode
          });
          
          await pendaftaran.save();
          results.push(pendaftaran);
        } catch (err) {
          errors.push({ 
            peserta: p, 
            error: err.message 
          });
        }
      }
    } else {
      if (!peserta.namaLengkap || !peserta.email || !peserta.nomorTelepon) {
        return res.status(400).json({ 
          message: "Nama lengkap, email, and nomor telepon are required" 
        });
      }
      
      const existingPendaftaran = await Pendaftaran.findOne({
        kegiatan: kegiatanId,
        email: peserta.email
      });
      
      if (existingPendaftaran) {
        return res.status(409).json({ 
          message: "Email already registered for this kegiatan" 
        });
      }
      
      const qrCode = crypto.randomBytes(16).toString('hex');
      
      const pendaftaran = new Pendaftaran({
        kegiatan: kegiatanId,
        namaKegiatan: kegiatanExists.namaKegiatan,
        namaLengkap: peserta.namaLengkap,
        email: peserta.email,
        nomorTelepon: peserta.nomorTelepon,
        tipePerson: peserta.tipePerson || 'external',
        qrCode
      });
      
      await pendaftaran.save();
      results.push(pendaftaran);
    }
    
    res.status(201).json({
      message: `Successfully registered ${results.length} participant(s)`,
      registered: results,
      errors: errors.length > 0 ? errors : undefined,
      totalRegistered: results.length,
      totalErrors: errors.length
    });
  } catch (err) {
    res.status(500).json({
      message: "Error registering participants",
      error: err.message
    });
  }
};

exports.getPendaftaranByKegiatan = async (req, res) => {
  try {
    const { kegiatanId } = req.params;
    
    const pendaftaran = await Pendaftaran.find({ kegiatan: kegiatanId })
      .sort({ tanggalDaftar: -1 });
    
    res.json(pendaftaran);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching pendaftaran",
      error: err.message
    });
  }
};

exports.getAllPendaftaran = async (req, res) => {
  try {
    const pendaftaran = await Pendaftaran.find()
      .sort({ tanggalDaftar: -1 });
    
    res.json(pendaftaran);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching pendaftaran",
      error: err.message
    });
  }
};

exports.updatePendaftaran = async (req, res) => {
  try {
    const { namaLengkap, email, nomorTelepon, tipePerson } = req.body;
    
    const pendaftaran = await Pendaftaran.findById(req.params.id);
    
    if (!pendaftaran) {
      return res.status(404).json({ message: "Pendaftaran not found" });
    }
    
    if (email && email !== pendaftaran.email) {
      const existingPendaftaran = await Pendaftaran.findOne({
        kegiatan: pendaftaran.kegiatan,
        email: email,
        _id: { $ne: pendaftaran._id }
      });
      
      if (existingPendaftaran) {
        return res.status(409).json({ 
          message: "Email already registered for this kegiatan" 
        });
      }
    }
    
    if (namaLengkap) pendaftaran.namaLengkap = namaLengkap;
    if (email) pendaftaran.email = email;
    if (nomorTelepon) pendaftaran.nomorTelepon = nomorTelepon;
    if (tipePerson) pendaftaran.tipePerson = tipePerson;
    
    if (!pendaftaran.qrCode) {
      const qrCodeData = crypto.randomBytes(16).toString('hex');
      const qrCodeImage = await QRCode.toDataURL(qrCodeData);
      pendaftaran.qrCode = qrCodeImage;
      pendaftaran.qrCodeData = qrCodeData;
    }
    
    await pendaftaran.save();
    
    res.json({
      message: "Pendaftaran updated successfully",
      pendaftaran
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating pendaftaran",
      error: err.message
    });
  }
};

exports.getPendaftaranById = async (req, res) => {
  try {
    const pendaftaran = await Pendaftaran.findById(req.params.id);
    
    if (!pendaftaran) {
      return res.status(404).json({ message: "Pendaftaran not found" });
    }
    
    res.json(pendaftaran);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching pendaftaran",
      error: err.message
    });
  }
};

exports.deletePendaftaran = async (req, res) => {
  try {
    const pendaftaran = await Pendaftaran.findByIdAndDelete(req.params.id);
    
    if (!pendaftaran) {
      return res.status(404).json({ message: "Pendaftaran not found" });
    }
    
    res.json({ message: "Pendaftaran deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting pendaftaran",
      error: err.message
    });
  }
};

exports.bulkDeletePendaftaran = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Array of IDs is required" });
    }
    
    const result = await Pendaftaran.deleteMany({ _id: { $in: ids } });
    
    res.json({
      message: `Successfully deleted ${result.deletedCount} pendaftaran`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({
      message: "Error bulk deleting pendaftaran",
      error: err.message
    });
  }
};

exports.getPendaftaranByKegiatanName = async (req, res) => {
  try {
    const { kegiatanName } = req.params;
    
    let query = {};
    if (kegiatanName && kegiatanName !== 'all') {
      query = { namaKegiatan: { $regex: kegiatanName, $options: 'i' } };
    }
    
    const [pendaftaran, allPendaftaran] = await Promise.all([
      Pendaftaran.find(query).sort({ tanggalDaftar: -1 }),
      Pendaftaran.find({}, 'namaKegiatan')
    ]);
    
    const uniqueKegiatan = [...new Set(allPendaftaran.map(item => item.namaKegiatan))];
    
    res.json({
      pendaftaran,
      uniqueKegiatan,
      total: pendaftaran.length
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching pendaftaran by kegiatan",
      error: err.message
    });
  }
};