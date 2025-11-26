const Absensi = require("../models/absensi");
const Pendaftaran = require("../models/pendaftaran");
const Umat = require("../models/umat");
const { logActivity } = require("../utils/activityLogger");

exports.scanQRCode = async (req, res) => {
  try {
    const { qrCodeData, kegiatanId } = req.body;
    
    if (!qrCodeData || !kegiatanId) {
      return res.status(400).json({ message: "QR Code data and kegiatan ID are required" });
    }
    
    const pendaftaran = await Pendaftaran.findOne({ 
      qrCodeData: qrCodeData,
      kegiatan: kegiatanId 
    }).populate('kegiatan');
    
    if (!pendaftaran) {
      return res.status(404).json({ message: "Invalid QR Code or kegiatan not found" });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let existingAbsensi = await Absensi.findOne({ 
      pendaftaran: pendaftaran._id, 
      kegiatan: kegiatanId,
      tanggal: { $gte: today, $lt: tomorrow }
    });
    
    if (existingAbsensi) {
      if (existingAbsensi.status === 'hadir') {
        return res.status(409).json({ 
          message: "Attendance already recorded for today",
          absensi: existingAbsensi,
          pendaftaran: pendaftaran
        });
      } else {
        existingAbsensi.status = 'hadir';
        existingAbsensi.tanggal = new Date();
        await existingAbsensi.save();
        
        await logActivity(req, {
          actionType: 'UPDATE',
          entityType: 'ABSENSI',
          entityId: existingAbsensi._id,
          entityName: pendaftaran.namaLengkap,
          description: `Updated absensi status: ${pendaftaran.namaLengkap}`,
          details: { 
            namaLengkap: pendaftaran.namaLengkap, 
            kegiatan: pendaftaran.kegiatan?.namaKegiatan || kegiatanId,
            status: existingAbsensi.status
          }
        });
        
        return res.json({
          message: "Attendance status updated successfully",
          absensi: existingAbsensi,
          pendaftaran: pendaftaran
        });
      }
    }
    
    const absensi = new Absensi({
      pendaftaran: pendaftaran._id,
      kegiatan: kegiatanId,
      status: 'hadir',
      tipePerson: pendaftaran.tipePerson,
      qrCode: qrCodeData
    });
    
    await absensi.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'ABSENSI',
      entityId: absensi._id,
      entityName: pendaftaran.namaLengkap,
      description: `Created new absensi: ${pendaftaran.namaLengkap}`,
      details: { 
        namaLengkap: pendaftaran.namaLengkap, 
        kegiatan: pendaftaran.kegiatan,
        status: absensi.status
      }
    });
    
    res.json({
      message: "Attendance recorded successfully",
      absensi: absensi,
      pendaftaran: pendaftaran
    });
  } catch (err) {
    res.status(500).json({
      message: "Error recording attendance",
      error: err.message
    });
  }
};

exports.createAbsensi = async (req, res) => {
  try {
    const { pendaftaran, kegiatan, status, tipePerson } = req.body;
    
    if (!pendaftaran || !kegiatan) {
      return res.status(400).json({ message: "Pendaftaran and kegiatan are required" });
    }
    
    const pendaftaranData = await Pendaftaran.findById(pendaftaran);
    if (!pendaftaranData) {
      return res.status(404).json({ message: "Pendaftaran not found" });
    }
    
    if (pendaftaranData.kegiatan.toString() !== kegiatan) {
      return res.status(400).json({ 
        message: "Selected pendaftaran is not registered for the selected kegiatan" 
      });
    }
    
    const existingAbsensi = await Absensi.findOne({
      pendaftaran,
      kegiatan,
      tanggal: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    
    if (existingAbsensi) {
      return res.status(409).json({ 
        message: "Attendance already recorded for this person and kegiatan today" 
      });
    }
    
    const absensi = new Absensi({
      pendaftaran,
      kegiatan,
      status: status || 'hadir',
      tipePerson: tipePerson || pendaftaranData.tipePerson || 'external'
    });
    
    await absensi.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'ABSENSI',
      entityId: absensi._id,
      entityName: pendaftaranData.namaLengkap,
      description: `Created new absensi: ${pendaftaranData.namaLengkap}`,
      details: { 
        namaLengkap: pendaftaranData.namaLengkap, 
        kegiatan: kegiatan,
        status: absensi.status
      }
    });
    
    res.status(201).json({
      message: "Absensi created successfully",
      absensi
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating absensi",
      error: err.message
    });
  }
};

exports.getAllAbsensi = async (req, res) => {
  try {
    const includeMissing = req.query.includeMissing === 'true';
    
    if (includeMissing) {
      const allPendaftaran = await Pendaftaran.find()
        .populate('kegiatan', 'namaKegiatan')
        .sort({ tanggalDaftar: -1 });
      
      const allAbsensi = await Absensi.find()
        .populate('pendaftaran', 'namaLengkap email namaKegiatan tipePerson')
        .populate('kegiatan', 'namaKegiatan')
        .sort({ tanggal: -1 });
      
      const absensiMap = new Map();
      allAbsensi.forEach(abs => {
        const key = `${abs.pendaftaran._id}_${abs.kegiatan._id}`;
        absensiMap.set(key, abs);
      });
      
      const result = allPendaftaran.map(pendaftaran => {
        const key = `${pendaftaran._id}_${pendaftaran.kegiatan._id}`;
        const existingAbsensi = absensiMap.get(key);
        
        if (existingAbsensi) {
          return {
            ...existingAbsensi.toObject(),
            pendaftaran: {
              _id: pendaftaran._id,
              namaLengkap: pendaftaran.namaLengkap,
              email: pendaftaran.email,
              namaKegiatan: pendaftaran.namaKegiatan,
              tipePerson: pendaftaran.tipePerson
            },
            kegiatan: {
              _id: pendaftaran.kegiatan._id,
              namaKegiatan: pendaftaran.kegiatan.namaKegiatan
            }
          };
        } else {
          return {
            _id: null,
            pendaftaran: {
              _id: pendaftaran._id,
              namaLengkap: pendaftaran.namaLengkap,
              email: pendaftaran.email,
              namaKegiatan: pendaftaran.namaKegiatan,
              tipePerson: pendaftaran.tipePerson
            },
            kegiatan: {
              _id: pendaftaran.kegiatan._id,
              namaKegiatan: pendaftaran.kegiatan.namaKegiatan
            },
            tanggal: pendaftaran.tanggalDaftar,
            status: 'tidak_hadir',
            tipePerson: pendaftaran.tipePerson,
            isMissing: true
          };
        }
      });
      
      return res.json(result);
    } else {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      const totalAbsensi = await Absensi.countDocuments();
      const totalPages = Math.ceil(totalAbsensi / limit);
      
      const absensi = await Absensi.find()
        .populate('pendaftaran', 'namaLengkap email namaKegiatan tipePerson')
        .populate('kegiatan', 'namaKegiatan')
        .sort({ tanggal: -1 })
        .skip(skip)
        .limit(limit);
      
      res.json({
        absensi,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalAbsensi: totalAbsensi,
          absensiPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "Error fetching absensi",
      error: err.message
    });
  }
};

exports.getAbsensiByKegiatan = async (req, res) => {
  try {
    const { kegiatanId } = req.params;
    
    const absensi = await Absensi.find({ kegiatan: kegiatanId })
      .populate('pendaftaran', 'namaLengkap email namaKegiatan tipePerson')
      .populate('kegiatan', 'namaKegiatan')
      .sort({ tanggal: -1 });
    
    res.json(absensi);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching absensi",
      error: err.message
    });
  }
};

exports.updateAbsensi = async (req, res) => {
  try {
    const { status, tipePerson } = req.body;
    
    const absensi = await Absensi.findById(req.params.id).populate('pendaftaran', 'namaLengkap');
    
    if (!absensi) {
      return res.status(404).json({ message: "Absensi not found" });
    }
    
    if (status) absensi.status = status;
    if (tipePerson) absensi.tipePerson = tipePerson;
    
    await absensi.save();
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'ABSENSI',
      entityId: absensi._id,
      entityName: absensi.pendaftaran?.namaLengkap || 'Unknown',
      description: `Updated absensi: ${absensi.pendaftaran?.namaLengkap || 'Unknown'}`,
      details: { 
        status: absensi.status,
        tipePerson: absensi.tipePerson
      }
    });
    
    res.json({
      message: "Absensi updated successfully",
      absensi
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating absensi",
      error: err.message
    });
  }
};

exports.deleteAbsensi = async (req, res) => {
  try {
    const absensi = await Absensi.findById(req.params.id).populate('pendaftaran', 'namaLengkap');
    
    if (!absensi) {
      return res.status(404).json({ message: "Absensi not found" });
    }
    
    await logActivity(req, {
      actionType: 'DELETE',
      entityType: 'ABSENSI',
      entityId: absensi._id,
      entityName: absensi.pendaftaran?.namaLengkap || 'Unknown',
      description: `Deleted absensi: ${absensi.pendaftaran?.namaLengkap || 'Unknown'}`,
      details: { 
        status: absensi.status,
        tipePerson: absensi.tipePerson
      }
    });
    
    await Absensi.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Absensi deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting absensi",
      error: err.message
    });
  }
};

exports.bulkDeleteAbsensi = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Array of IDs is required" });
    }
    
    const absensiList = await Absensi.find({ _id: { $in: ids } }).populate('pendaftaran', 'namaLengkap');
    
    if (absensiList.length === 0) {
      return res.status(404).json({ message: "No absensi found to delete" });
    }
    
    // Log activity for each deleted absensi
    for (const absensi of absensiList) {
      await logActivity(req, {
        actionType: 'DELETE',
        entityType: 'ABSENSI',
        entityId: absensi._id,
        entityName: absensi.pendaftaran?.namaLengkap || 'Unknown',
        description: `Bulk deleted absensi: ${absensi.pendaftaran?.namaLengkap || 'Unknown'}`,
        details: { 
          status: absensi.status,
          tipePerson: absensi.tipePerson
        }
      });
    }
    
    await Absensi.deleteMany({ _id: { $in: ids } });
    
    res.json({ 
      message: `Successfully deleted ${absensiList.length} absensi`,
      deletedCount: absensiList.length
    });
  } catch (err) {
    res.status(500).json({
      message: "Error bulk deleting absensi",
      error: err.message
    });
  }
};
