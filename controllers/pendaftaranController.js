const Pendaftaran = require("../models/pendaftaran");
const Kegiatan = require("../models/kegiatan");
const Umat = require("../models/umat");
const crypto = require("crypto");
const QRCode = require("qrcode");
const { logActivity } = require("../utils/activityLogger");

exports.createPendaftaran = async (req, res) => {
  try {
    const { kegiatan, namaLengkap, email, nomorTelepon } = req.body;
    
    if (!kegiatan || !namaLengkap || !email || !nomorTelepon) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    const kegiatanExists = await Kegiatan.findById(kegiatan);
    if (!kegiatanExists) {
      return res.status(404).json({ message: "Kegiatan not found" });
    }
    
    if (kegiatanExists.status !== 'sedang_berlangsung') {
      return res.status(400).json({ 
        message: "Pendaftaran hanya dapat dilakukan untuk kegiatan dengan status Aktif" 
      });
    }
    
    // Check if user is already registered for this activity
    const existingRegistration = await Pendaftaran.findOne({
      kegiatan: kegiatan,
      email: email
    });
    
    if (existingRegistration) {
      return res.status(400).json({ 
        message: "Anda sudah terdaftar untuk kegiatan ini sebelumnya" 
      });
    }
    
    const existingUmat = await Umat.findOne({ email: email });
    const tipePerson = existingUmat ? 'internal' : 'external';
    
    const qrCodeData = crypto.randomBytes(16).toString('hex');
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);
    
    const pendaftaran = new Pendaftaran({
      kegiatan,
      namaKegiatan: kegiatanExists.namaKegiatan,
      namaLengkap,
      email,
      nomorTelepon,
      tipePerson,
      qrCode: qrCodeImage,
      qrCodeData: qrCodeData
    });
    
    await pendaftaran.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'PENDAFTARAN',
      entityId: pendaftaran._id,
      entityName: pendaftaran.namaLengkap,
      description: `Created new pendaftaran: ${pendaftaran.namaLengkap} for ${kegiatanExists.namaKegiatan}`,
      details: { 
        namaLengkap: pendaftaran.namaLengkap, 
        email: pendaftaran.email,
        kegiatan: kegiatanExists.namaKegiatan,
        tipePerson: pendaftaran.tipePerson
      }
    });
    
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
    
    if (kegiatanExists.status !== 'sedang_berlangsung') {
      return res.status(400).json({ 
        message: "Pendaftaran hanya dapat dilakukan untuk kegiatan dengan status Aktif" 
      });
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
          
          const existingUmat = await Umat.findOne({ email: p.email });
          const tipePerson = existingUmat ? 'internal' : 'external';
          
          const qrCode = crypto.randomBytes(16).toString('hex');
          
          const pendaftaran = new Pendaftaran({
            kegiatan: kegiatanId,
            namaKegiatan: kegiatanExists.namaKegiatan,
            namaLengkap: p.namaLengkap,
            email: p.email,
            nomorTelepon: p.nomorTelepon,
            tipePerson,
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

exports.checkRegistrationStatus = async (req, res) => {
  try {
    const { kegiatanId, email } = req.params;
    
    const existingRegistration = await Pendaftaran.findOne({
      kegiatan: kegiatanId,
      email: email
    });
    
    res.json({
      isRegistered: !!existingRegistration,
      registration: existingRegistration
    });
  } catch (err) {
    res.status(500).json({
      message: "Error checking registration status",
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const totalPendaftaran = await Pendaftaran.countDocuments();
    const totalPages = Math.ceil(totalPendaftaran / limit);
    
    const pendaftaran = await Pendaftaran.find()
      .sort({ tanggalDaftar: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      pendaftaran,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalPendaftaran: totalPendaftaran,
        pendaftaranPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
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