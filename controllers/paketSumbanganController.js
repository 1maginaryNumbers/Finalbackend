const PaketSumbangan = require("../models/paketSumbangan");
const PaketSumbanganTransaksi = require("../models/paketSumbanganTransaksi");
const { logActivity } = require("../utils/activityLogger");
const midtransClient = require("midtrans-client");
const nodemailer = require("nodemailer");

const getMidtransSnap = () => {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  return new midtransClient.Snap({
    isProduction: isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
  });
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
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const sendReceiptEmail = async (transaksi, paket) => {
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
    const orderDate = formatDate(transaksi.tanggalTransaksi || new Date());
    
    const detailBarangHtml = paket.detailBarang && paket.detailBarang.length > 0
      ? paket.detailBarang.map(barang => `
          <tr>
            <td style="padding: 8px 0; color: #666;">${barang.namaBarang || barang.namaItem || 'Item'}:</td>
            <td style="padding: 8px 0; font-weight: bold;">${barang.jumlah} ${barang.keterangan ? `(${barang.keterangan})` : ''}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="2" style="padding: 8px 0; color: #999; font-style: italic;">Tidak ada detail barang</td></tr>';
    
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
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Terima Kasih Atas Sumbangan Anda</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Vihara Buddhayana Dharmawira Centre</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Halo <strong>${transaksi.namaPembeli}</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Terima kasih telah melakukan pembelian paket sumbangan di Vihara BDC. Berikut adalah detail transaksi Anda:</p>
            
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
              <h2 style="color: #2c3e50; margin-top: 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Detail Paket</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Nama Paket:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${paket.namaPaket}</td>
                </tr>
                ${paket.deskripsi ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Deskripsi:</td>
                  <td style="padding: 8px 0;">${paket.deskripsi}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #666;">Nominal:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #667eea;">${formatCurrency(transaksi.nominal || paket.nominal)}</td>
                </tr>
              </table>
            </div>
            
            ${paket.detailBarang && paket.detailBarang.length > 0 ? `
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #2c3e50; margin-top: 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Isi Paket</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                ${detailBarangHtml}
              </table>
            </div>
            ` : ''}
            
            ${transaksi.alamat ? `
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #2c3e50; margin-top: 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Alamat</h2>
              <p style="margin: 10px 0; white-space: pre-wrap;">${transaksi.alamat}</p>
            </div>
            ` : ''}
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #2c3e50; margin-top: 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Metode Pembayaran</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Metode:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${transaksi.paymentGateway === 'midtrans' ? 'Midtrans' : 'Transfer'}</td>
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
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Catatan:</strong> Terima kasih atas sumbangan Anda. Kami akan menghubungi Anda untuk konfirmasi lebih lanjut.
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
Terima Kasih Atas Sumbangan Anda
Vihara Buddhayana Dharmawira Centre

Halo ${transaksi.namaPembeli},

Terima kasih telah melakukan pembelian paket sumbangan di Vihara BDC. Berikut adalah detail transaksi Anda:

Detail Transaksi:
- Order ID: ${transaksi.midtransOrderId || transaksi._id}
- Tanggal: ${orderDate}
- Status: ${transaksi.status === 'berhasil' || transaksi.status === 'settlement' ? 'Berhasil' : transaksi.status}

Detail Paket:
- Nama Paket: ${paket.namaPaket}
${paket.deskripsi ? `- Deskripsi: ${paket.deskripsi}\n` : ''}
- Nominal: ${formatCurrency(transaksi.nominal || paket.nominal)}

${paket.detailBarang && paket.detailBarang.length > 0 ? `Isi Paket:\n${paket.detailBarang.map(barang => `- ${barang.namaBarang || barang.namaItem || 'Item'}: ${barang.jumlah} ${barang.keterangan ? `(${barang.keterangan})` : ''}`).join('\n')}\n` : ''}
${transaksi.alamat ? `Alamat:\n${transaksi.alamat}\n` : ''}
Metode Pembayaran:
- Metode: ${transaksi.paymentGateway === 'midtrans' ? 'Midtrans' : 'Transfer'}
${transaksi.midtransPaymentType ? `- Tipe Pembayaran: ${transaksi.midtransPaymentType}${transaksi.midtransBank ? ` (${transaksi.midtransBank})` : ''}\n` : ''}
${transaksi.midtransVaNumber ? `- Virtual Account: ${transaksi.midtransVaNumber}\n` : ''}

Catatan: Terima kasih atas sumbangan Anda. Kami akan menghubungi Anda untuk konfirmasi lebih lanjut.

Jika Anda memiliki pertanyaan, silakan hubungi kami melalui:
Email: info@viharabdc.com | Telepon: (021) 1234-5678

Terima kasih atas dukungan Anda kepada Vihara BDC.
    `;

    const mailOptions = {
      from: `"Vihara BDC" <${fromEmail}>`,
      to: transaksi.email,
      subject: `Konfirmasi Pembelian Paket Sumbangan - ${paket.namaPaket} - Vihara BDC`,
      text: textContent,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Receipt email sent successfully to ${transaksi.email}. MessageId: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`Failed to send receipt email to ${transaksi.email}:`, err.message);
    return { success: false, error: err.message };
  }
};

exports.createPaketSumbangan = async (req, res) => {
  try {
    const { namaPaket, deskripsi, nominal, detailBarang, status, tanggalMulai, tanggalSelesai, stok } = req.body;
    
    if (!namaPaket || !nominal) {
      return res.status(400).json({ message: "Nama paket and nominal are required" });
    }
    
    let parsedDetailBarang = [];
    if (detailBarang) {
      try {
        parsedDetailBarang = typeof detailBarang === 'string' ? JSON.parse(detailBarang) : detailBarang;
      } catch (e) {
        parsedDetailBarang = [];
      }
    }
    
    let gambar = '';
    if (req.file && req.file.buffer) {
      const imageBuffer = req.file.buffer;
      const imageBase64 = imageBuffer.toString('base64');
      const mimetype = req.file.mimetype || 'image/jpeg';
      gambar = `data:${mimetype};base64,${imageBase64}`;
    }
    
    const paketSumbangan = new PaketSumbangan({
      namaPaket,
      deskripsi,
      nominal: parseFloat(nominal),
      detailBarang: parsedDetailBarang,
      status: status || 'nonaktif',
      tanggalMulai: tanggalMulai ? new Date(tanggalMulai) : null,
      tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : null,
      gambar,
      stok: stok ? parseInt(stok) : null,
      terjual: 0
    });
    
    await paketSumbangan.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'PAKET_SUMBANGAN',
      entityId: paketSumbangan._id,
      entityName: paketSumbangan.namaPaket,
      description: `Created new paket sumbangan: ${paketSumbangan.namaPaket}`,
      details: { 
        namaPaket: paketSumbangan.namaPaket,
        nominal: paketSumbangan.nominal,
        status: paketSumbangan.status
      }
    });
    
    res.status(201).json({
      message: "Paket sumbangan created successfully",
      paketSumbangan
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating paket sumbangan",
      error: err.message
    });
  }
};

exports.getAllPaketSumbangan = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const paketSumbangan = await PaketSumbangan.find(query).sort({ createdAt: -1 });
    
    res.json(paketSumbangan);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching paket sumbangan",
      error: err.message
    });
  }
};

exports.getPaketSumbanganById = async (req, res) => {
  try {
    const paketSumbangan = await PaketSumbangan.findById(req.params.id);
    
    if (!paketSumbangan) {
      return res.status(404).json({ message: "Paket sumbangan not found" });
    }
    
    res.json(paketSumbangan);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching paket sumbangan",
      error: err.message
    });
  }
};

exports.updatePaketSumbangan = async (req, res) => {
  try {
    const { namaPaket, deskripsi, nominal, detailBarang, status, tanggalMulai, tanggalSelesai, stok } = req.body;
    
    const paketSumbangan = await PaketSumbangan.findById(req.params.id);
    
    if (!paketSumbangan) {
      return res.status(404).json({ message: "Paket sumbangan not found" });
    }
    
    const oldData = {
      namaPaket: paketSumbangan.namaPaket,
      nominal: paketSumbangan.nominal,
      status: paketSumbangan.status
    };
    
    if (namaPaket) paketSumbangan.namaPaket = namaPaket;
    if (deskripsi !== undefined) paketSumbangan.deskripsi = deskripsi;
    if (nominal) paketSumbangan.nominal = parseFloat(nominal);
    if (detailBarang !== undefined) {
      try {
        paketSumbangan.detailBarang = typeof detailBarang === 'string' ? JSON.parse(detailBarang) : detailBarang;
      } catch (e) {
        paketSumbangan.detailBarang = [];
      }
    }
    if (status) paketSumbangan.status = status;
    if (tanggalMulai !== undefined) paketSumbangan.tanggalMulai = tanggalMulai ? new Date(tanggalMulai) : null;
    if (tanggalSelesai !== undefined) paketSumbangan.tanggalSelesai = tanggalSelesai ? new Date(tanggalSelesai) : null;
    if (stok !== undefined) paketSumbangan.stok = stok ? parseInt(stok) : null;
    
    if (req.file && req.file.buffer) {
      const imageBuffer = req.file.buffer;
      const imageBase64 = imageBuffer.toString('base64');
      const mimetype = req.file.mimetype || 'image/jpeg';
      paketSumbangan.gambar = `data:${mimetype};base64,${imageBase64}`;
    }
    
    await paketSumbangan.save();
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'PAKET_SUMBANGAN',
      entityId: paketSumbangan._id,
      entityName: paketSumbangan.namaPaket,
      description: `Updated paket sumbangan: ${paketSumbangan.namaPaket}`,
      details: { 
        oldData,
        newData: {
          namaPaket: paketSumbangan.namaPaket,
          nominal: paketSumbangan.nominal,
          status: paketSumbangan.status
        }
      }
    });
    
    res.json({
      message: "Paket sumbangan updated successfully",
      paketSumbangan
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating paket sumbangan",
      error: err.message
    });
  }
};

exports.deletePaketSumbangan = async (req, res) => {
  try {
    const paketSumbangan = await PaketSumbangan.findById(req.params.id);
    
    if (!paketSumbangan) {
      return res.status(404).json({ message: "Paket sumbangan not found" });
    }
    
    await logActivity(req, {
      actionType: 'DELETE',
      entityType: 'PAKET_SUMBANGAN',
      entityId: paketSumbangan._id,
      entityName: paketSumbangan.namaPaket,
      description: `Deleted paket sumbangan: ${paketSumbangan.namaPaket}`,
      details: { 
        namaPaket: paketSumbangan.namaPaket,
        nominal: paketSumbangan.nominal,
        status: paketSumbangan.status
      }
    });
    
    await PaketSumbangan.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Paket sumbangan deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting paket sumbangan",
      error: err.message
    });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { paketSumbangan, namaPembeli, email, nomorTelepon, alamat } = req.body;
    
    if (!paketSumbangan || !namaPembeli) {
      return res.status(400).json({ message: "Paket sumbangan and nama pembeli are required" });
    }
    
    const paket = await PaketSumbangan.findById(paketSumbangan);
    if (!paket) {
      return res.status(404).json({ message: "Paket sumbangan not found" });
    }
    
    if (paket.status !== 'aktif') {
      return res.status(400).json({ message: "Paket sumbangan is not active" });
    }
    
    if (paket.stok !== null && paket.stok <= paket.terjual) {
      return res.status(400).json({ message: "Paket sumbangan is out of stock" });
    }
    
    const orderId = `PAKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const transaksi = new PaketSumbanganTransaksi({
      paketSumbangan,
      namaPembeli,
      email,
      nomorTelepon,
      alamat,
      nominal: paket.nominal,
      status: 'pending',
      paymentGateway: 'midtrans',
      midtransOrderId: orderId
    });
    
    await transaksi.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'PAKET_SUMBANGAN_TRANSAKSI',
      entityId: transaksi._id,
      entityName: `${namaPembeli} - ${paket.namaPaket}`,
      description: `Created paket sumbangan transaction: ${namaPembeli} purchased ${paket.namaPaket}`,
      details: { 
        namaPembeli,
        paket: paket.namaPaket,
        nominal: paket.nominal,
        status: 'pending'
      }
    });
    
    const snap = getMidtransSnap();
    
    const itemDetails = paket.detailBarang.map((barang, index) => ({
      id: `${paket._id}-${index}`,
      price: 0,
      quantity: barang.jumlah,
      name: barang.namaBarang
    }));
    
    itemDetails.push({
      id: paket._id.toString(),
      price: paket.nominal,
      quantity: 1,
      name: `Paket Sumbangan - ${paket.namaPaket}`
    });
    
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: paket.nominal
      },
      customer_details: {
        first_name: namaPembeli,
        email: email || '',
        phone: nomorTelepon || ''
      },
      item_details: itemDetails
    };
    
    if (paket.tanggalSelesai) {
      const expiryTime = new Date(paket.tanggalSelesai);
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

exports.getAllTransaksi = async (req, res) => {
  try {
    const transaksi = await PaketSumbanganTransaksi.find()
      .populate('paketSumbangan', 'namaPaket nominal')
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
    
    const transaksi = await PaketSumbanganTransaksi.findById(req.params.id).populate('paketSumbangan');
    
    if (!transaksi) {
      return res.status(404).json({ message: "Transaksi not found" });
    }
    
    const oldStatus = transaksi.status;
    if (status) transaksi.status = status;
    
    await transaksi.save();
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'PAKET_SUMBANGAN_TRANSAKSI',
      entityId: transaksi._id,
      entityName: `${transaksi.namaPembeli} - ${transaksi.paketSumbangan?.namaPaket || 'Paket'}`,
      description: `Updated paket sumbangan transaction status from ${oldStatus} to ${status}`,
      details: { 
        oldStatus,
        newStatus: status,
        namaPembeli: transaksi.namaPembeli,
        nominal: transaksi.nominal
      }
    });
    
    if (status === 'berhasil' || status === 'settlement') {
      // Use populated paketSumbangan if available, otherwise fetch it
      let paket = transaksi.paketSumbangan;
      if (!paket || typeof paket === 'string' || !paket._id) {
        paket = await PaketSumbangan.findById(transaksi.paketSumbangan);
      }
      
      if (paket) {
        paket.terjual = (paket.terjual || 0) + 1;
        await paket.save();
      }
      
      // Send receipt email when status changes to successful
      if (oldStatus !== 'berhasil' && oldStatus !== 'settlement') {
        const emailResult = await sendReceiptEmail(transaksi, paket);
        if (!emailResult.success) {
          console.warn(`Failed to send receipt email to ${transaksi.email}:`, emailResult.error);
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

exports.handleWebhook = async (req, res) => {
  try {
    const { transaction_status, order_id, payment_type, transaction_id, va_numbers } = req.body;
    
    const transaksi = await PaketSumbanganTransaksi.findOne({ midtransOrderId: order_id }).populate('paketSumbangan');
    
    if (!transaksi) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    transaksi.midtransTransactionStatus = transaction_status;
    transaksi.midtransTransactionId = transaction_id;
    transaksi.midtransPaymentType = payment_type;
    
    if (va_numbers && va_numbers.length > 0) {
      transaksi.midtransVaNumber = va_numbers[0].va_number;
      transaksi.midtransBank = va_numbers[0].bank;
    }
    
    let newStatus = 'pending';
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      newStatus = 'berhasil';
    } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
      newStatus = 'gagal';
    } else if (transaction_status === 'pending') {
      newStatus = 'pending';
    }
    
    const oldStatus = transaksi.status;
    transaksi.status = newStatus;
    await transaksi.save();
    
    if (newStatus === 'berhasil' && oldStatus !== 'berhasil') {
      // Use populated paketSumbangan if available, otherwise fetch it
      let paket = transaksi.paketSumbangan;
      if (!paket || typeof paket === 'string' || !paket._id) {
        paket = await PaketSumbangan.findById(transaksi.paketSumbangan);
      }
      
      if (paket) {
        paket.terjual = (paket.terjual || 0) + 1;
        await paket.save();
      }
      
      // Send receipt email when payment is successful
      const emailResult = await sendReceiptEmail(transaksi, paket);
      if (!emailResult.success) {
        console.warn(`Failed to send receipt email to ${transaksi.email}:`, emailResult.error);
      }
    }
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'PAKET_SUMBANGAN_TRANSAKSI',
      entityId: transaksi._id,
      entityName: `${transaksi.namaPembeli} - ${transaksi.paketSumbangan?.namaPaket || 'Paket'}`,
      description: `Webhook updated paket sumbangan transaction status from ${oldStatus} to ${newStatus}`,
      details: { 
        oldStatus,
        newStatus,
        transaction_status,
        namaPembeli: transaksi.namaPembeli,
        nominal: transaksi.nominal
      }
    });
    
    res.json({ message: "Webhook processed successfully" });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({
      message: "Error processing webhook",
      error: err.message
    });
  }
};

