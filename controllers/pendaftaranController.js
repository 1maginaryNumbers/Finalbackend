const Pendaftaran = require("../models/pendaftaran");
const Kegiatan = require("../models/kegiatan");
const Umat = require("../models/umat");
const crypto = require("crypto");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
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
    const { namaLengkap, email, nomorTelepon, tipePerson, kegiatan } = req.body;
    
    const pendaftaran = await Pendaftaran.findById(req.params.id).populate('kegiatan');
    
    if (!pendaftaran) {
      return res.status(404).json({ message: "Pendaftaran not found" });
    }
    
    const currentKegiatanId = pendaftaran.kegiatan._id || pendaftaran.kegiatan;
    const currentKegiatan = await Kegiatan.findById(currentKegiatanId);
    
    if (kegiatan && kegiatan !== currentKegiatanId.toString()) {
      if (currentKegiatan && currentKegiatan.status === 'selesai') {
        return res.status(400).json({ 
          message: "Cannot change kegiatan when current kegiatan status is 'Selesai'" 
        });
      }
      
      const newKegiatan = await Kegiatan.findById(kegiatan);
      if (!newKegiatan) {
        return res.status(404).json({ message: "New kegiatan not found" });
      }
      
      if (email) {
        const existingPendaftaran = await Pendaftaran.findOne({
          kegiatan: kegiatan,
          email: email,
          _id: { $ne: pendaftaran._id }
        });
        
        if (existingPendaftaran) {
          return res.status(409).json({ 
            message: "Email already registered for the new kegiatan" 
          });
        }
      }
      
      pendaftaran.kegiatan = kegiatan;
      pendaftaran.namaKegiatan = newKegiatan.namaKegiatan;
      
      const qrCodeData = crypto.randomBytes(16).toString('hex');
      const qrCodeImage = await QRCode.toDataURL(qrCodeData);
      pendaftaran.qrCode = qrCodeImage;
      pendaftaran.qrCodeData = qrCodeData;
    } else {
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
    
    const kegiatanChanged = kegiatan && kegiatan !== currentKegiatanId.toString();
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'PENDAFTARAN',
      entityId: pendaftaran._id,
      entityName: pendaftaran.namaLengkap,
      description: `Updated pendaftaran: ${pendaftaran.namaLengkap}${kegiatanChanged ? ' (kegiatan changed, QR code regenerated)' : ''}`,
      details: { 
        namaLengkap: pendaftaran.namaLengkap, 
        email: pendaftaran.email,
        kegiatan: pendaftaran.namaKegiatan,
        qrCodeRegenerated: kegiatanChanged
      }
    });
    
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

const createTransporter = () => {
  let transporter;
  
  if (process.env.EMAIL_SERVICE === 'gmail') {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Gmail configuration requires EMAIL_USER and EMAIL_PASSWORD environment variables');
    }
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else if (process.env.EMAIL_HOST) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('SMTP configuration requires EMAIL_USER and EMAIL_PASSWORD environment variables');
    }
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    throw new Error('Email configuration not found');
  }
  
  return transporter;
};

exports.sendQRCodeEmail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pendaftaran = await Pendaftaran.findById(id).populate('kegiatan');
    
    if (!pendaftaran) {
      return res.status(404).json({ message: "Pendaftaran not found" });
    }
    
    if (!pendaftaran.email) {
      return res.status(400).json({ message: "No email address found for this registration" });
    }
    
    if (!pendaftaran.qrCode) {
      return res.status(400).json({ message: "No QR code found for this registration" });
    }
    
    let transporter;
    try {
      transporter = createTransporter();
    } catch (configError) {
      return res.status(500).json({
        message: configError.message || "Email configuration error",
        error: "Configuration error",
        code: "ECONFIG"
      });
    }
    
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@vihara.com';
    const kegiatan = pendaftaran.kegiatan || { namaKegiatan: pendaftaran.namaKegiatan };
    
    const qrCodeBase64 = pendaftaran.qrCode.split(',')[1];
    
    const mailOptions = {
      from: `"Vihara BDC" <${fromEmail}>`,
      to: pendaftaran.email,
      subject: `QR Code dan Detail Pendaftaran - ${kegiatan.namaKegiatan || pendaftaran.namaKegiatan}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Pendaftaran Berhasil</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Yth. <strong>${pendaftaran.namaLengkap}</strong>,
            </p>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              Terima kasih telah mendaftar untuk kegiatan <strong>${kegiatan.namaKegiatan || pendaftaran.namaKegiatan}</strong>.
              Berikut adalah detail pendaftaran dan QR Code Anda:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #667eea; margin-top: 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                Detail Pendaftaran
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;"><strong>Nama Lengkap:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${pendaftaran.namaLengkap}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${pendaftaran.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Nomor Telepon:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${pendaftaran.nomorTelepon || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Kegiatan:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${kegiatan.namaKegiatan || pendaftaran.namaKegiatan}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Tanggal Daftar:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${new Date(pendaftaran.tanggalDaftar).toLocaleDateString('id-ID', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Tipe:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${pendaftaran.tipePerson === 'internal' ? 'Internal' : 'External'}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #667eea; margin-top: 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 20px;">
                QR Code Anda
              </h3>
              <img src="cid:qrcode" alt="QR Code" style="max-width: 300px; height: auto; border: 4px solid #667eea; border-radius: 8px; padding: 10px; background: white;" />
              <p style="font-size: 12px; color: #999; margin-top: 15px;">
                Simpan QR Code ini untuk keperluan absensi saat kegiatan berlangsung.
              </p>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>Catatan Penting:</strong> Harap simpan email ini dan tampilkan QR Code saat mengikuti kegiatan untuk proses absensi.
              </p>
            </div>
            
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
              <p style="margin: 0;">Email ini dikirim secara otomatis dari Vihara BDC System.</p>
              <p style="margin: 5px 0 0 0;">Jika Anda memiliki pertanyaan, silakan hubungi kami.</p>
            </div>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `QRCode_${pendaftaran.namaLengkap.replace(/\s+/g, '_')}.png`,
          content: qrCodeBase64,
          encoding: 'base64',
          cid: 'qrcode'
        }
      ]
    };
    
    await transporter.sendMail(mailOptions);
    
    await logActivity(req, {
      actionType: 'SEND_EMAIL',
      entityType: 'PENDAFTARAN',
      entityId: pendaftaran._id,
      entityName: pendaftaran.namaLengkap,
      description: `Sent QR code email to ${pendaftaran.email}`,
      details: { 
        email: pendaftaran.email,
        kegiatan: kegiatan.namaKegiatan || pendaftaran.namaKegiatan
      }
    });
    
    res.json({
      message: "QR code and details sent successfully",
      email: pendaftaran.email
    });
  } catch (err) {
    console.error("Error sending QR code email:", err);
    res.status(500).json({
      message: "Error sending QR code email",
      error: err.message
    });
  }
};

exports.bulkSendQRCodeEmail = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Array of IDs is required" });
    }
    
    const pendaftaranList = await Pendaftaran.find({ _id: { $in: ids } }).populate('kegiatan');
    
    if (pendaftaranList.length === 0) {
      return res.status(404).json({ message: "No pendaftaran found" });
    }
    
    const validPendaftaran = pendaftaranList.filter(p => p.email && p.qrCode);
    
    if (validPendaftaran.length === 0) {
      return res.status(400).json({ 
        message: "No valid pendaftaran found with both email and QR code" 
      });
    }
    
    let transporter;
    try {
      transporter = createTransporter();
    } catch (configError) {
      return res.status(500).json({
        message: configError.message || "Email configuration error",
        error: "Configuration error",
        code: "ECONFIG"
      });
    }
    
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@vihara.com';
    const successfulEmails = [];
    const failedEmails = [];
    
    for (const pendaftaran of validPendaftaran) {
      try {
        const kegiatan = pendaftaran.kegiatan || { namaKegiatan: pendaftaran.namaKegiatan };
        const qrCodeBase64 = pendaftaran.qrCode.split(',')[1];
        
        const mailOptions = {
          from: `"Vihara BDC" <${fromEmail}>`,
          to: pendaftaran.email,
          subject: `QR Code dan Detail Pendaftaran - ${kegiatan.namaKegiatan || pendaftaran.namaKegiatan}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Pendaftaran Berhasil</h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                  Yth. <strong>${pendaftaran.namaLengkap}</strong>,
                </p>
                
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                  Terima kasih telah mendaftar untuk kegiatan <strong>${kegiatan.namaKegiatan || pendaftaran.namaKegiatan}</strong>.
                  Berikut adalah detail pendaftaran dan QR Code Anda:
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h3 style="color: #667eea; margin-top: 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                    Detail Pendaftaran
                  </h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #666; width: 40%;"><strong>Nama Lengkap:</strong></td>
                      <td style="padding: 8px 0; color: #333;">${pendaftaran.namaLengkap}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                      <td style="padding: 8px 0; color: #333;">${pendaftaran.email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;"><strong>Nomor Telepon:</strong></td>
                      <td style="padding: 8px 0; color: #333;">${pendaftaran.nomorTelepon || '-'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;"><strong>Kegiatan:</strong></td>
                      <td style="padding: 8px 0; color: #333;">${kegiatan.namaKegiatan || pendaftaran.namaKegiatan}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;"><strong>Tanggal Daftar:</strong></td>
                      <td style="padding: 8px 0; color: #333;">${new Date(pendaftaran.tanggalDaftar).toLocaleDateString('id-ID', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;"><strong>Tipe:</strong></td>
                      <td style="padding: 8px 0; color: #333;">${pendaftaran.tipePerson === 'internal' ? 'Internal' : 'External'}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h3 style="color: #667eea; margin-top: 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 20px;">
                    QR Code Anda
                  </h3>
                  <img src="cid:qrcode" alt="QR Code" style="max-width: 300px; height: auto; border: 4px solid #667eea; border-radius: 8px; padding: 10px; background: white;" />
                  <p style="font-size: 12px; color: #999; margin-top: 15px;">
                    Simpan QR Code ini untuk keperluan absensi saat kegiatan berlangsung.
                  </p>
                </div>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>Catatan Penting:</strong> Harap simpan email ini dan tampilkan QR Code saat mengikuti kegiatan untuk proses absensi.
                  </p>
                </div>
                
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
                  <p style="margin: 0;">Email ini dikirim secara otomatis dari Vihara BDC System.</p>
                  <p style="margin: 5px 0 0 0;">Jika Anda memiliki pertanyaan, silakan hubungi kami.</p>
                </div>
              </div>
            </div>
          `,
          attachments: [
            {
              filename: `QRCode_${pendaftaran.namaLengkap.replace(/\s+/g, '_')}.png`,
              content: qrCodeBase64,
              encoding: 'base64',
              cid: 'qrcode'
            }
          ]
        };
        
        await transporter.sendMail(mailOptions);
        successfulEmails.push({ email: pendaftaran.email, nama: pendaftaran.namaLengkap });
        
        await logActivity(req, {
          actionType: 'SEND_EMAIL',
          entityType: 'PENDAFTARAN',
          entityId: pendaftaran._id,
          entityName: pendaftaran.namaLengkap,
          description: `Sent QR code email to ${pendaftaran.email} (bulk send)`,
          details: { 
            email: pendaftaran.email,
            kegiatan: kegiatan.namaKegiatan || pendaftaran.namaKegiatan
          }
        });
      } catch (err) {
        console.error(`Failed to send email to ${pendaftaran.email}:`, err.message);
        failedEmails.push({ 
          email: pendaftaran.email, 
          nama: pendaftaran.namaLengkap,
          error: err.message 
        });
      }
    }
    
    res.json({
      message: `Bulk email send completed`,
      total: validPendaftaran.length,
      successful: successfulEmails.length,
      failed: failedEmails.length,
      successfulEmails: successfulEmails.map(e => e.email),
      failedEmails: failedEmails.map(e => ({ email: e.email, nama: e.nama, error: e.error }))
    });
  } catch (err) {
    console.error("Error bulk sending QR code emails:", err);
    res.status(500).json({
      message: "Error bulk sending QR code emails",
      error: err.message
    });
  }
};