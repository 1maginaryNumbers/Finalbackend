const Sumbangan = require("../models/sumbangan");
const { logActivity } = require("../utils/activityLogger");
const Transaksi = require("../models/transaksi");
const midtransClient = require("midtrans-client");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");

exports.createSumbangan = async (req, res) => {
  try {
    // Check if sumbangan already exists, if so return it
    let sumbangan = await Sumbangan.findOne();
    
    if (sumbangan) {
      return res.json({
        message: "Sumbangan already exists",
        sumbangan
      });
    }
    
    let qrisImage = '';
    let qrisString = '';
    
    if (req.file && req.file.buffer) {
      const imageBuffer = req.file.buffer;
      const imageBase64 = imageBuffer.toString('base64');
      const mimetype = req.file.mimetype || 'image/jpeg';
      qrisImage = `data:${mimetype};base64,${imageBase64}`;
    } else {
      // Generate reusable QRIS for voluntary donation (no expiration, reusable)
      console.log('Generating reusable QRIS for voluntary donation...');
      const orderId = `DONASI-SUKARELA-${Date.now()}`;
      const amount = 100000; // Default amount, can be changed by user
      
      const generatedQR = await generateQRCode(orderId, amount, 'Donasi Sukarela', null, true);
      
      if (generatedQR) {
        qrisImage = generatedQR.image;
        qrisString = generatedQR.string;
        console.log('Reusable QRIS generated and stored successfully');
      } else {
        console.log('Failed to generate QRIS, will be generated on request');
      }
    }
    
    sumbangan = new Sumbangan({
      qrisImage,
      qrisString
    });
    
    await sumbangan.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'SUMBANGAN',
      entityId: sumbangan._id,
      entityName: 'Donasi Sukarela',
      description: `Created voluntary donation configuration`,
      details: {}
    });
    
    res.status(201).json({
      message: "Sumbangan created successfully",
      sumbangan
    });
  } catch (err) {
    console.error('Error creating sumbangan:', err);
    res.status(500).json({
      message: "Error creating sumbangan",
      error: err.message
    });
  }
};

exports.getAllSumbangan = async (req, res) => {
  try {
    // For voluntary donation, only return one active sumbangan
    // Create if doesn't exist
    let sumbangan = await Sumbangan.findOne();
    
    if (!sumbangan) {
      // Create default sumbangan with QRIS
      const orderId = `DONASI-SUKARELA-${Date.now()}`;
      const amount = 100000;
      const generatedQR = await generateQRCode(orderId, amount, 'Donasi Sukarela', null, true);
      
      sumbangan = new Sumbangan({
        qrisImage: generatedQR ? generatedQR.image : '',
        qrisString: generatedQR ? generatedQR.string : ''
      });
      
      await sumbangan.save();
    } else if (!sumbangan.qrisImage && !sumbangan.qrisString) {
      // Generate QRIS if doesn't exist
      const orderId = `DONASI-SUKARELA-${Date.now()}`;
      const amount = 100000;
      const generatedQR = await generateQRCode(orderId, amount, 'Donasi Sukarela', null, true);
      
      if (generatedQR) {
        sumbangan.qrisImage = generatedQR.image;
        sumbangan.qrisString = generatedQR.string;
        await sumbangan.save();
      }
    }
    
    res.json([sumbangan]);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching sumbangan",
      error: err.message
    });
  }
};

exports.getSumbanganById = async (req, res) => {
  try {
    const sumbangan = await Sumbangan.findById(req.params.id);
    
    if (!sumbangan) {
      return res.status(404).json({ message: "Sumbangan not found" });
    }
    
    res.json(sumbangan);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching sumbangan",
      error: err.message
    });
  }
};

exports.getQRISImage = async (req, res) => {
  try {
    // Get the only sumbangan (voluntary donation)
    let sumbangan = await Sumbangan.findOne();
    
    if (!sumbangan) {
      // Create default sumbangan with QRIS
      const orderId = `DONASI-SUKARELA-${Date.now()}`;
      const amount = 100000;
      const generatedQR = await generateQRCode(orderId, amount, 'Donasi Sukarela', null, true);
      
      sumbangan = new Sumbangan({
        qrisImage: generatedQR ? generatedQR.image : '',
        qrisString: generatedQR ? generatedQR.string : ''
      });
      
      await sumbangan.save();
    }

    if (sumbangan.qrisImage) {
      const base64Data = sumbangan.qrisImage.split(',')[1];
      const mimeType = sumbangan.qrisImage.match(/data:([^;]+)/)?.[1] || 'image/png';
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="qris-${sumbangan._id}.png"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(imageBuffer);
      return;
    }

    // Generate QRIS if doesn't exist
    const orderId = `DONASI-SUKARELA-${Date.now()}`;
    const amount = 100000;
    const generatedQR = await generateQRCode(orderId, amount, 'Donasi Sukarela', null, true);
    
    if (generatedQR) {
      sumbangan.qrisImage = generatedQR.image;
      sumbangan.qrisString = generatedQR.string;
      await sumbangan.save();
      
      const base64Data = generatedQR.image.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="qris-${sumbangan._id}.png"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(imageBuffer);
    } else {
      throw new Error('Failed to generate QRIS');
    }
  } catch (err) {
    console.error('Error generating QRIS image:', err);
    res.status(500).json({
      message: "Error generating QRIS image",
      error: err.message
    });
  }
};

exports.getQRISString = async (req, res) => {
  try {
    // Get the only sumbangan (voluntary donation)
    let sumbangan = await Sumbangan.findOne();
    
    if (!sumbangan) {
      // Create default sumbangan with QRIS
      const orderId = `DONASI-SUKARELA-${Date.now()}`;
      const amount = 100000;
      const generatedQR = await generateQRCode(orderId, amount, 'Donasi Sukarela', null, true);
      
      sumbangan = new Sumbangan({
        qrisImage: generatedQR ? generatedQR.image : '',
        qrisString: generatedQR ? generatedQR.string : ''
      });
      
      await sumbangan.save();
    }
    
    if (!sumbangan.qrisString) {
      // Generate QRIS if doesn't exist
      const orderId = `DONASI-SUKARELA-${Date.now()}`;
      const amount = 100000;
      const generatedQR = await generateQRCode(orderId, amount, 'Donasi Sukarela', null, true);
      
      if (generatedQR) {
        sumbangan.qrisImage = generatedQR.image;
        sumbangan.qrisString = generatedQR.string;
        await sumbangan.save();
      } else {
        return res.status(404).json({ message: "QRIS string not found" });
      }
    }
    
    res.json({
      qrisString: sumbangan.qrisString,
      orderId: sumbangan._id.toString()
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching QRIS string",
      error: err.message
    });
  }
};

exports.updateSumbangan = async (req, res) => {
  try {
    const { regenerateQR } = req.body;
    
    const sumbangan = await Sumbangan.findById(req.params.id);
    
    if (!sumbangan) {
      return res.status(404).json({ message: "Sumbangan not found" });
    }
    
    if (req.file && req.file.buffer) {
      const imageBuffer = req.file.buffer;
      const imageBase64 = imageBuffer.toString('base64');
      const mimetype = req.file.mimetype || 'image/jpeg';
      sumbangan.qrisImage = `data:${mimetype};base64,${imageBase64}`;
    } else if (regenerateQR === 'true' || regenerateQR === true) {
      console.log('Regenerating QRIS for voluntary donation:', sumbangan._id);
      const orderId = `DONASI-SUKARELA-${Date.now()}`;
      const amount = 100000;
      const generatedQR = await generateQRCode(orderId, amount, 'Donasi Sukarela', null, true);
      if (generatedQR) {
        sumbangan.qrisImage = generatedQR.image;
        sumbangan.qrisString = generatedQR.string;
        console.log('QRIS regenerated successfully');
      } else {
        console.warn('QRIS regeneration failed');
      }
    } else if (!sumbangan.qrisImage && !req.file) {
      console.log('No QRIS image exists, generating automatically during update...');
      const orderId = `DONASI-SUKARELA-${Date.now()}`;
      const amount = 100000;
      const generatedQR = await generateQRCode(orderId, amount, 'Donasi Sukarela', null, true);
      if (generatedQR) {
        sumbangan.qrisImage = generatedQR.image;
        sumbangan.qrisString = generatedQR.string;
        console.log('QRIS generated during update');
      }
    }
    
    await sumbangan.save();
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'SUMBANGAN',
      entityId: sumbangan._id,
      entityName: 'Donasi Sukarela',
      description: `Updated voluntary donation QRIS`,
      details: {}
    });
    
    res.json({
      message: "Sumbangan updated successfully",
      sumbangan
    });
  } catch (err) {
    console.error('Error updating sumbangan:', err);
    res.status(500).json({
      message: "Error updating sumbangan",
      error: err.message
    });
  }
};

exports.deleteSumbangan = async (req, res) => {
  try {
    const sumbangan = await Sumbangan.findByIdAndDelete(req.params.id);
    
    if (!sumbangan) {
      return res.status(404).json({ message: "Sumbangan not found" });
    }
    
    res.json({ message: "Sumbangan deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting sumbangan",
      error: err.message
    });
  }
};

exports.createTransaksi = async (req, res) => {
  try {
    const { sumbangan, namaDonatur, email, nominal, metodePembayaran, buktiPembayaran } = req.body;
    
    if (!sumbangan || !namaDonatur || !nominal) {
      return res.status(400).json({ message: "Sumbangan, nama donatur, and nominal are required" });
    }
    
    const sumbanganExists = await Sumbangan.findById(sumbangan);
    if (!sumbanganExists) {
      return res.status(404).json({ message: "Sumbangan not found" });
    }
    
    const transaksi = new Transaksi({
      sumbangan,
      namaDonatur,
      email,
      nominal,
      metodePembayaran,
      buktiPembayaran,
      status: req.body.status || 'pending'
    });
    
    await transaksi.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'TRANSAKSI',
      entityId: transaksi._id,
      entityName: `${namaDonatur} - ${sumbanganExists.namaEvent}`,
      description: `Created donation transaction: ${namaDonatur} - ${sumbanganExists.namaEvent}`,
      details: { 
        namaDonatur,
        sumbangan: sumbanganExists.namaEvent,
        nominal,
        metodePembayaran,
        status: transaksi.status
      }
    });
    
    if (transaksi.status === 'berhasil') {
      sumbanganExists.danaTerkumpul = (sumbanganExists.danaTerkumpul || 0) + transaksi.nominal;
      await sumbanganExists.save();
    }
    
    res.status(201).json({
      message: "Transaksi created successfully",
      transaksi
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating transaksi",
      error: err.message
    });
  }
};

exports.getAllTransaksi = async (req, res) => {
  try {
    const transaksi = await Transaksi.find()
      .populate('sumbangan', 'namaPaket')
      .sort({ tanggalTransaksi: -1 });
    res.json(transaksi);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching transaksi",
      error: err.message
    });
  }
};

exports.updateTransaksiStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const transaksi = await Transaksi.findById(req.params.id).populate('sumbangan', 'namaEvent');
    
    if (!transaksi) {
      return res.status(404).json({ message: "Transaksi not found" });
    }
    
    const oldStatus = transaksi.status;
    if (status) transaksi.status = status;
    
    await transaksi.save();
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'TRANSAKSI',
      entityId: transaksi._id,
      entityName: `${transaksi.namaDonatur} - Donasi Sukarela`,
      description: `Updated donation transaction status from ${oldStatus} to ${status}`,
      details: { 
        oldStatus,
        newStatus: status,
        namaDonatur: transaksi.namaDonatur,
        nominal: transaksi.nominal
      }
    });
    
    if (status === 'berhasil' || status === 'settlement') {
      const sumbangan = await Sumbangan.findById(transaksi.sumbangan);
      if (sumbangan) {
        sumbangan.danaTerkumpul = (sumbangan.danaTerkumpul || 0) + transaksi.nominal;
        await sumbangan.save();
      }
      
      if (oldStatus !== 'berhasil' && oldStatus !== 'settlement') {
        try {
          await sendReceiptEmail(transaksi);
        } catch (emailError) {
          console.error('Error sending receipt email:', emailError);
        }
      }
    }
    
    res.json({
      message: "Transaksi status updated successfully",
      transaksi
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating transaksi status",
      error: err.message
    });
  }
};

const createTransporter = () => {
  let transporter;
  
  if (process.env.EMAIL_SERVICE === 'gmail') {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return null;
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
      return null;
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
    return null;
  }
  
  return transporter;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  
  const dateOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  const timeOptions = {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  const dateStr = d.toLocaleDateString('id-ID', dateOptions);
  const timeStr = d.toLocaleTimeString('id-ID', timeOptions);
  
  return `${dateStr} pukul ${timeStr}`;
};

const sendReceiptEmail = async (transaksi) => {
  try {
    if (!transaksi.email || transaksi.email.trim() === '') {
      console.log('No email address provided for transaction, skipping email receipt');
      return { success: false, error: 'No email address' };
    }

    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email transporter not configured, skipping email receipt');
      return { success: false, error: 'Email not configured' };
    }

    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@vihara.com';
    
    let transaksiDate;
    if (transaksi.tanggalTransaksi) {
      transaksiDate = transaksi.tanggalTransaksi;
    } else if (transaksi.createdAt) {
      transaksiDate = transaksi.createdAt;
    } else {
      const freshTransaksi = await Transaksi.findById(transaksi._id);
      transaksiDate = freshTransaksi?.tanggalTransaksi || freshTransaksi?.createdAt || new Date();
    }
    
    const orderDate = formatDate(transaksiDate);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Terima Kasih Atas Donasi Anda</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Vihara Buddhayana Dharmawira Centre</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Halo <strong>${transaksi.namaDonatur}</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Terima kasih telah memberikan donasi sukarela kepada Vihara BDC. Berikut adalah bukti transaksi Anda:</p>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #2c3e50; margin-top: 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Detail Transaksi</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Order ID:</td>
                  <td style="padding: 8px 0; font-weight: bold; font-family: monospace;">${transaksi.midtransOrderId || transaksi._id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Tanggal:</td>
                  <td style="padding: 8px 0;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Nama Donatur:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${transaksi.namaDonatur}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Nominal:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #667eea; font-size: 18px;">${formatCurrency(transaksi.nominal)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Status:</td>
                  <td style="padding: 8px 0;">
                    <span style="background-color: #28a745; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                      ${transaksi.status === 'berhasil' || transaksi.status === 'settlement' ? 'Berhasil' : transaksi.status}
                    </span>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #2c3e50; margin-top: 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Metode Pembayaran</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Metode:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${transaksi.paymentGateway === 'midtrans' ? 'Midtrans' : transaksi.metodePembayaran || 'Transfer'}</td>
                </tr>
                ${transaksi.midtransPaymentType ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Tipe Pembayaran:</td>
                  <td style="padding: 8px 0;">${transaksi.midtransPaymentType}${transaksi.midtransBank ? ` (${transaksi.midtransBank})` : ''}</td>
                </tr>
                ` : ''}
                ${transaksi.midtransVaNumber ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Virtual Account:</td>
                  <td style="padding: 8px 0; font-family: monospace;">${transaksi.midtransVaNumber}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${transaksi.pesan ? `
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #2c3e50; margin-top: 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Pesan/Doa</h2>
              <p style="margin: 10px 0; white-space: pre-wrap;">${transaksi.pesan}</p>
            </div>
            ` : ''}
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Catatan:</strong> Terima kasih atas donasi sukarela Anda. Semoga Dharma memberkati niat baik Anda.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
              <p style="margin: 5px 0;">Jika Anda memiliki pertanyaan, silakan hubungi kami melalui:</p>
              <p style="margin: 5px 0;">Email: info@viharabdc.com | Telepon: (021) 1234-5678</p>
              <p style="margin: 15px 0 5px 0;">Terima kasih atas dukungan Anda kepada Vihara BDC.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Terima Kasih Atas Donasi Anda
Vihara Buddhayana Dharmawira Centre

Halo ${transaksi.namaDonatur},

Terima kasih telah memberikan donasi sukarela kepada Vihara BDC. Berikut adalah bukti transaksi Anda:

Detail Transaksi:
- Order ID: ${transaksi.midtransOrderId || transaksi._id}
- Tanggal: ${orderDate}
- Nama Donatur: ${transaksi.namaDonatur}
- Nominal: ${formatCurrency(transaksi.nominal)}
- Status: ${transaksi.status === 'berhasil' || transaksi.status === 'settlement' ? 'Berhasil' : transaksi.status}

Metode Pembayaran:
- Metode: ${transaksi.paymentGateway === 'midtrans' ? 'Midtrans' : transaksi.metodePembayaran || 'Transfer'}
${transaksi.midtransPaymentType ? `- Tipe Pembayaran: ${transaksi.midtransPaymentType}${transaksi.midtransBank ? ` (${transaksi.midtransBank})` : ''}` : ''}
${transaksi.midtransVaNumber ? `- Virtual Account: ${transaksi.midtransVaNumber}` : ''}

${transaksi.pesan ? `Pesan/Doa:\n${transaksi.pesan}\n` : ''}

Catatan: Terima kasih atas donasi sukarela Anda. Semoga Dharma memberkati niat baik Anda.

Jika Anda memiliki pertanyaan, silakan hubungi kami melalui:
Email: info@viharabdc.com | Telepon: (021) 1234-5678

Terima kasih atas dukungan Anda kepada Vihara BDC.
    `;

    const mailOptions = {
      from: fromEmail,
      to: transaksi.email,
      subject: 'Bukti Donasi - Vihara Buddhayana Dharmawira Centre',
      html: htmlContent,
      text: textContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Receipt email sent successfully to', transaksi.email, 'MessageId:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending receipt email:', error);
    return { success: false, error: error.message };
  }
};

const getMidtransSnap = () => {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  return new midtransClient.Snap({
    isProduction: isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
  });
};

const getMidtransCoreApi = () => {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  return new midtransClient.CoreApi({
    isProduction: isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
  });
};

const generateQRCode = async (orderId, amount, eventName, expirationDate, isReusable = false) => {
  try {
    if (!process.env.MIDTRANS_SERVER_KEY) {
      console.error('MIDTRANS_SERVER_KEY is not set');
      return null;
    }

    const coreApi = getMidtransCoreApi();
    
    const parameter = {
      payment_type: 'qris',
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      item_details: [
        {
          id: orderId,
          price: amount,
          quantity: 1,
          name: 'Donasi Sukarela'
        }
      ]
    };

    if (expirationDate) {
      const expiryTime = new Date(expirationDate);
      expiryTime.setHours(23, 59, 59, 999);
      const expiryMinutes = Math.floor((expiryTime.getTime() - Date.now()) / (1000 * 60));
      
      if (expiryMinutes > 0) {
        parameter.custom_expiry = {
          expiry_duration: expiryMinutes,
          unit: 'minute'
        };
        console.log('Setting QRIS expiration:', expiryMinutes, 'minutes from now');
      }
    }

    if (isReusable) {
      parameter.qris = {
        acquirer: 'gopay'
      };
    }
    
    console.log('Attempting to generate QRIS with orderId:', orderId, 'amount:', amount, 'isReusable:', isReusable);
    const chargeResponse = await coreApi.charge(parameter);
    console.log('Midtrans charge response:', JSON.stringify(chargeResponse, null, 2));
    
    if (chargeResponse.status_code === '201' && chargeResponse.qr_string) {
      const qrString = chargeResponse.qr_string;
      console.log('QRIS string received, generating QR code image...');
      
      const qrCodeImage = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 2
      });
      
      console.log('QRIS image generated successfully');
      return {
        image: qrCodeImage,
        string: qrString,
        transactionId: chargeResponse.transaction_id,
        orderId: chargeResponse.order_id,
        expirationDate: expirationDate
      };
    } else {
      console.error('Midtrans charge failed or no QR string:', chargeResponse);
      return null;
    }
  } catch (err) {
    console.error('Error generating QR code:', err);
    console.error('Error details:', err.message);
    if (err.ApiResponse) {
      console.error('Midtrans API response:', err.ApiResponse);
    }
    return null;
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { sumbangan, namaDonatur, email, nomorTelepon, nominal } = req.body;
    
    if (!sumbangan || !namaDonatur || !nominal) {
      return res.status(400).json({ message: "Sumbangan, nama donatur, and nominal are required" });
    }
    
    const sumbanganExists = await Sumbangan.findById(sumbangan);
    if (!sumbanganExists) {
      return res.status(404).json({ message: "Sumbangan not found" });
    }
    
    // Voluntary donation is always active
    
    const orderId = `DONATION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const transaksi = new Transaksi({
      sumbangan,
      namaDonatur,
      email,
      nomorTelepon,
      nominal: parseFloat(nominal),
      metodePembayaran: 'midtrans',
      status: 'pending',
      paymentGateway: 'midtrans',
      midtransOrderId: orderId
    });
    
    await transaksi.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'TRANSAKSI',
      entityId: transaksi._id,
      entityName: `${namaDonatur} - Donasi Sukarela`,
      description: `Created donation transaction: ${namaDonatur} donated ${nominal}`,
      details: { 
        namaDonatur,
        sumbangan: sumbanganExists.namaEvent,
        nominal: parseFloat(nominal),
        status: 'pending'
      }
    });
    
    const snap = getMidtransSnap();
    const expirationDate = sumbanganExists.qrisExpirationDate || sumbanganExists.tanggalSelesai;
    
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: parseFloat(nominal)
      },
      customer_details: {
        first_name: namaDonatur,
        email: email || '',
        phone: nomorTelepon || ''
      },
      item_details: [
        {
          id: sumbanganExists._id.toString(),
          price: parseFloat(nominal),
          quantity: 1,
          name: `Donasi - ${sumbanganExists.namaEvent}`
        }
      ]
    };

    if (expirationDate) {
      const expiryTime = new Date(expirationDate);
      expiryTime.setHours(23, 59, 59, 999);
      const expiryMinutes = Math.floor((expiryTime.getTime() - Date.now()) / (1000 * 60));
      
      if (expiryMinutes > 0) {
        parameter.custom_expiry = {
          expiry_duration: expiryMinutes,
          unit: 'minute'
        };
      }
    }
    
    const transaction = await snap.createTransaction(parameter);
    
    transaksi.midtransTransactionId = transaction.token;
    await transaksi.save();
    
    res.json({
      message: "Payment created successfully",
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      transaksi: transaksi
    });
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({
      message: "Error creating payment",
      error: err.message
    });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const notificationJson = req.body;
    
    const snap = getMidtransSnap();
    const statusResponse = await snap.transaction.notification(notificationJson);
    
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        console.log(`Transaction ${orderId} is challenged by FDS`);
      } else if (fraudStatus === 'accept') {
        console.log(`Transaction ${orderId} successfully captured`);
      }
    } else if (transactionStatus === 'settlement') {
      console.log(`Transaction ${orderId} successfully settled`);
    } else if (transactionStatus === 'deny') {
      console.log(`Transaction ${orderId} denied by FDS`);
    } else if (transactionStatus === 'cancel' || transactionStatus === 'expire') {
      console.log(`Transaction ${orderId} cancelled or expired`);
    } else if (transactionStatus === 'pending') {
      console.log(`Transaction ${orderId} is pending`);
    }
    
    const transaksi = await Transaksi.findOne({ midtransOrderId: orderId });
    
    if (!transaksi) {
      return res.status(404).json({ message: "Transaksi not found" });
    }
    
    transaksi.midtransTransactionStatus = transactionStatus;
    transaksi.midtransTransactionId = statusResponse.transaction_id;
    transaksi.midtransPaymentType = statusResponse.payment_type;
    
    if (statusResponse.va_numbers && statusResponse.va_numbers.length > 0) {
      transaksi.midtransVaNumber = statusResponse.va_numbers[0].va_number;
      transaksi.midtransBank = statusResponse.va_numbers[0].bank;
    }
    
    let newStatus = 'pending';
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      newStatus = 'berhasil';
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
      newStatus = 'gagal';
    } else if (transactionStatus === 'pending') {
      newStatus = 'pending';
    }
    
    const oldStatus = transaksi.status;
    transaksi.status = newStatus;
    await transaksi.save();
    
    // Log activity for webhook status update
    try {
      await logActivity(req, {
        actionType: 'UPDATE',
        entityType: 'TRANSAKSI',
        entityId: transaksi._id,
        entityName: `${transaksi.namaDonatur || 'Unknown'} - Donation`,
        description: `Webhook updated donation transaction status from ${oldStatus} to ${newStatus}`,
        details: {
          oldStatus,
          newStatus,
          orderId: orderId,
          transactionStatus: transactionStatus,
          paymentType: statusResponse.payment_type
        }
      });
    } catch (logError) {
      console.error('Error logging webhook activity:', logError);
    }
    
    if (newStatus === 'berhasil' && oldStatus !== 'berhasil') {
      // Voluntary donation QRIS is reusable, no need to regenerate
      // Just log the successful transaction
      
      try {
        await sendReceiptEmail(transaksi);
      } catch (emailError) {
        console.error('Error sending receipt email:', emailError);
      }
    }
    
    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({
      message: "Error processing webhook",
      error: err.message
    });
  }
};

exports.syncTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaksi = await Transaksi.findById(id);
    if (!transaksi) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    if (!transaksi.midtransOrderId) {
      return res.status(400).json({ message: "Transaction does not have Midtrans order ID" });
    }
    
    const coreApi = getMidtransCoreApi();
    const statusResponse = await coreApi.transaction.status(transaksi.midtransOrderId);
    
    const transactionStatus = statusResponse.transaction_status;
    
    transaksi.midtransTransactionStatus = transactionStatus;
    transaksi.midtransTransactionId = statusResponse.transaction_id;
    transaksi.midtransPaymentType = statusResponse.payment_type;
    
    if (statusResponse.va_numbers && statusResponse.va_numbers.length > 0) {
      transaksi.midtransVaNumber = statusResponse.va_numbers[0].va_number;
      transaksi.midtransBank = statusResponse.va_numbers[0].bank;
    }
    
    let newStatus = 'pending';
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      newStatus = 'berhasil';
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
      newStatus = 'gagal';
    } else if (transactionStatus === 'pending') {
      newStatus = 'pending';
    }
    
    const oldStatus = transaksi.status;
    transaksi.status = newStatus;
    await transaksi.save();
    
    if (newStatus === 'berhasil' && oldStatus !== 'berhasil') {
      const sumbangan = await Sumbangan.findById(transaksi.sumbangan);
      if (sumbangan) {
        sumbangan.danaTerkumpul = (sumbangan.danaTerkumpul || 0) + transaksi.nominal;
        await sumbangan.save();
      }
      
      try {
        await sendReceiptEmail(transaksi);
      } catch (emailError) {
        console.error('Error sending receipt email:', emailError);
      }
    }
    
    res.json({
      message: "Transaction status synced successfully",
      transaksi,
      midtransStatus: statusResponse
    });
  } catch (err) {
    console.error('Error syncing transaction status:', err);
    res.status(500).json({
      message: "Error syncing transaction status",
      error: err.message
    });
  }
};

exports.syncAllPendingTransactions = async (req, res) => {
  try {
    const pendingTransactions = await Transaksi.find({
      paymentGateway: 'midtrans',
      status: 'pending',
      midtransOrderId: { $exists: true, $ne: null }
    });
    
    const coreApi = getMidtransCoreApi();
    const results = [];
    
    for (const transaksi of pendingTransactions) {
      try {
        const statusResponse = await coreApi.transaction.status(transaksi.midtransOrderId);
        const transactionStatus = statusResponse.transaction_status;
        
        transaksi.midtransTransactionStatus = transactionStatus;
        transaksi.midtransTransactionId = statusResponse.transaction_id;
        transaksi.midtransPaymentType = statusResponse.payment_type;
        
        if (statusResponse.va_numbers && statusResponse.va_numbers.length > 0) {
          transaksi.midtransVaNumber = statusResponse.va_numbers[0].va_number;
          transaksi.midtransBank = statusResponse.va_numbers[0].bank;
        }
        
        let newStatus = 'pending';
        if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
          newStatus = 'berhasil';
        } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
          newStatus = 'gagal';
        }
        
        const oldStatus = transaksi.status;
        transaksi.status = newStatus;
        await transaksi.save();
        
        if (newStatus === 'berhasil' && oldStatus !== 'berhasil') {
          const sumbangan = await Sumbangan.findById(transaksi.sumbangan);
          if (sumbangan) {
            sumbangan.danaTerkumpul = (sumbangan.danaTerkumpul || 0) + transaksi.nominal;
            await sumbangan.save();
          }
        }
        
        results.push({
          transaksiId: transaksi._id,
          orderId: transaksi.midtransOrderId,
          oldStatus,
          newStatus,
          synced: true
        });
      } catch (err) {
        console.error(`Error syncing transaction ${transaksi._id}:`, err);
        results.push({
          transaksiId: transaksi._id,
          orderId: transaksi.midtransOrderId,
          synced: false,
          error: err.message
        });
      }
    }
    
    res.json({
      message: `Synced ${results.filter(r => r.synced).length} of ${results.length} transactions`,
      results
    });
  } catch (err) {
    console.error('Error syncing all transactions:', err);
    res.status(500).json({
      message: "Error syncing transactions",
      error: err.message
    });
  }
};
