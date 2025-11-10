const Jadwal = require("../models/jadwal");
const Kegiatan = require("../models/kegiatan");
const { logActivity } = require("../utils/activityLogger");

exports.createJadwal = async (req, res) => {
  try {
    const { judul, deskripsi, tanggal, waktuMulai, waktuSelesai, kategori, tempat, kapasitas } = req.body;
    
    if (!judul || !tanggal) {
      return res.status(400).json({ message: "Judul and tanggal are required" });
    }
    
    // Create corresponding kegiatan with status "akan_datang" first
    const kegiatanDate = new Date(tanggal);
    const kegiatan = new Kegiatan({
      namaKegiatan: judul,
      deskripsi: deskripsi || '',
      tanggalMulai: kegiatanDate,
      tanggalSelesai: kegiatanDate,
      waktuMulai,
      waktuSelesai,
      tempat,
      kapasitas,
      kategori,
      status: 'akan_datang'
    });
    
    await kegiatan.save();
    
    // Create jadwal linked to the kegiatan
    const jadwal = new Jadwal({
      judul,
      deskripsi,
      tanggal: new Date(tanggal),
      waktuMulai,
      waktuSelesai,
      kategori,
      tempat,
      kapasitas,
      kegiatanId: kegiatan._id
    });
    
    await jadwal.save();
    await jadwal.populate('kategori');
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'JADWAL',
      entityId: jadwal._id,
      entityName: jadwal.judul,
      description: `Created new schedule: ${jadwal.judul}`,
      details: { judul: jadwal.judul, tanggal: jadwal.tanggal }
    });
    
    res.status(201).json({
      message: "Jadwal created successfully",
      jadwal
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating jadwal",
      error: err.message
    });
  }
};

exports.getAllJadwal = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let query = {};
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.tanggal = { $gte: startDate, $lte: endDate };
    }
    
    const jadwal = await Jadwal.find(query)
      .populate('kategori')
      .sort({ tanggal: 1, waktuMulai: 1 });
    
    res.json(jadwal);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching jadwal",
      error: err.message
    });
  }
};

exports.getJadwalById = async (req, res) => {
  try {
    const jadwal = await Jadwal.findById(req.params.id).populate('kategori');
    
    if (!jadwal) {
      return res.status(404).json({ message: "Jadwal not found" });
    }
    
    res.json(jadwal);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching jadwal",
      error: err.message
    });
  }
};

exports.updateJadwal = async (req, res) => {
  try {
    const { judul, deskripsi, tanggal, waktuMulai, waktuSelesai, kategori, tempat, kapasitas } = req.body;
    
    const jadwal = await Jadwal.findById(req.params.id);
    
    if (!jadwal) {
      return res.status(404).json({ message: "Jadwal not found" });
    }
    
    if (judul) jadwal.judul = judul;
    if (deskripsi !== undefined) jadwal.deskripsi = deskripsi;
    if (tanggal) jadwal.tanggal = new Date(tanggal);
    if (waktuMulai !== undefined) jadwal.waktuMulai = waktuMulai;
    if (waktuSelesai !== undefined) jadwal.waktuSelesai = waktuSelesai;
    if (kategori !== undefined) jadwal.kategori = kategori;
    if (tempat !== undefined) jadwal.tempat = tempat;
    if (kapasitas !== undefined) jadwal.kapasitas = kapasitas;
    jadwal.updatedAt = new Date();
    
    await jadwal.save();
    await jadwal.populate('kategori');
    
    // If this jadwal is linked to a kegiatan, update the kegiatan as well
    if (jadwal.kegiatanId) {
      const kegiatan = await Kegiatan.findById(jadwal.kegiatanId);
      if (kegiatan) {
        // Update kegiatan fields if they were changed in jadwal
        if (judul) kegiatan.namaKegiatan = judul;
        if (deskripsi !== undefined) kegiatan.deskripsi = deskripsi;
        if (tanggal) {
          kegiatan.tanggalMulai = new Date(tanggal);
          kegiatan.tanggalSelesai = new Date(tanggal);
        }
        if (waktuMulai !== undefined) kegiatan.waktuMulai = waktuMulai;
        if (waktuSelesai !== undefined) kegiatan.waktuSelesai = waktuSelesai;
        if (tempat !== undefined) kegiatan.tempat = tempat;
        if (kapasitas !== undefined) kegiatan.kapasitas = kapasitas;
        if (kategori !== undefined) kegiatan.kategori = kategori;
        await kegiatan.save();
        
        // Recreate all jadwal entries for this kegiatan to keep them in sync
        await Jadwal.deleteMany({ kegiatanId: kegiatan._id });
        const startDate = new Date(kegiatan.tanggalMulai);
        const endDate = new Date(kegiatan.tanggalSelesai);
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          const newJadwal = new Jadwal({
            judul: kegiatan.namaKegiatan,
            deskripsi: kegiatan.deskripsi,
            tanggal: new Date(currentDate),
            waktuMulai: kegiatan.waktuMulai,
            waktuSelesai: kegiatan.waktuSelesai,
            kategori: kegiatan.kategori,
            tempat: kegiatan.tempat,
            kapasitas: kegiatan.kapasitas,
            kegiatanId: kegiatan._id
          });
          await newJadwal.save();
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'JADWAL',
      entityId: jadwal._id,
      entityName: jadwal.judul,
      description: `Updated schedule: ${jadwal.judul}`,
      details: { judul: jadwal.judul, tanggal: jadwal.tanggal }
    });
    
    res.json({
      message: "Jadwal updated successfully",
      jadwal
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating jadwal",
      error: err.message
    });
  }
};

exports.deleteJadwal = async (req, res) => {
  try {
    const jadwal = await Jadwal.findById(req.params.id);
    
    if (!jadwal) {
      return res.status(404).json({ message: "Jadwal not found" });
    }
    
    // If this jadwal is linked to a kegiatan, delete the entire kegiatan and all its jadwal entries
    if (jadwal.kegiatanId) {
      await Kegiatan.findByIdAndDelete(jadwal.kegiatanId);
      await Jadwal.deleteMany({ kegiatanId: jadwal.kegiatanId });
    } else {
      // If not linked to kegiatan, just delete this jadwal
      await Jadwal.findByIdAndDelete(req.params.id);
    }
    
    await logActivity(req, {
      actionType: 'DELETE',
      entityType: 'JADWAL',
      entityId: jadwal._id,
      entityName: jadwal.judul,
      description: `Deleted schedule: ${jadwal.judul}`,
      details: { judul: jadwal.judul, tanggal: jadwal.tanggal }
    });
    
    res.json({ message: "Jadwal deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting jadwal",
      error: err.message
    });
  }
};

exports.bulkDeleteJadwal = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Array of IDs is required" });
    }
    
    const jadwalList = await Jadwal.find({ _id: { $in: ids } });
    
    if (jadwalList.length === 0) {
      return res.status(404).json({ message: "No jadwal found to delete" });
    }
    
    // Get unique kegiatanIds that need to be deleted
    const kegiatanIds = [...new Set(jadwalList.filter(j => j.kegiatanId).map(j => j.kegiatanId.toString()))];
    
    // Delete kegiatan and all their jadwal entries
    if (kegiatanIds.length > 0) {
      await Kegiatan.deleteMany({ _id: { $in: kegiatanIds } });
      await Jadwal.deleteMany({ kegiatanId: { $in: kegiatanIds } });
    }
    
    // Delete jadwal entries that are not linked to kegiatan
    const jadwalIdsToDelete = jadwalList.filter(j => !j.kegiatanId).map(j => j._id);
    if (jadwalIdsToDelete.length > 0) {
      await Jadwal.deleteMany({ _id: { $in: jadwalIdsToDelete } });
    }
    
    // Log activity for each deleted jadwal
    for (const jadwal of jadwalList) {
      await logActivity(req, {
        actionType: 'DELETE',
        entityType: 'JADWAL',
        entityId: jadwal._id,
        entityName: jadwal.judul,
        description: `Bulk deleted schedule: ${jadwal.judul}`,
        details: { judul: jadwal.judul, tanggal: jadwal.tanggal }
      });
    }
    
    res.json({ 
      message: `Successfully deleted ${jadwalList.length} jadwal`,
      deletedCount: jadwalList.length
    });
  } catch (err) {
    res.status(500).json({
      message: "Error bulk deleting jadwal",
      error: err.message
    });
  }
};

