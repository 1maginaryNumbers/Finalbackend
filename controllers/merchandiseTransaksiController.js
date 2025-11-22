const MerchandiseTransaksi = require("../models/merchandiseTransaksi");
const Merchandise = require("../models/merchandise");
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

const sendReceiptEmail = async (transaksi, merchandise) => {
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
    const orderDate = formatDate(transaksi.tanggalTransaksi);
    
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
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Terima Kasih Atas Pembelian Anda</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Vihara Buddhayana Dharmawira Centre</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Halo <strong>${transaksi.namaPembeli}</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Terima kasih telah melakukan pembelian merchandise di Vihara BDC. Berikut adalah detail transaksi Anda:</p>
            
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
              <h2 style="color: #2c3e50; margin-top: 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Detail Produk</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Produk:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${merchandise.nama}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Harga per item:</td>
                  <td style="padding: 8px 0;">${formatCurrency(merchandise.harga)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Jumlah:</td>
                  <td style="padding: 8px 0;">${transaksi.jumlah} item</td>
                </tr>
                <tr style="border-top: 2px solid #dee2e6; margin-top: 10px;">
                  <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #2c3e50;">Total:</td>
                  <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #667eea;">${formatCurrency(transaksi.totalHarga)}</td>
                </tr>
              </table>
            </div>
            
            ${transaksi.alamatPengiriman ? `
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #2c3e50; margin-top: 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Alamat Pengiriman</h2>
              <p style="margin: 10px 0; white-space: pre-wrap;">${transaksi.alamatPengiriman}</p>
            </div>
            ` : ''}
            
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
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Catatan:</strong> Pesanan Anda sedang diproses. Kami akan menghubungi Anda untuk konfirmasi pengiriman.
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
Terima Kasih Atas Pembelian Anda
Vihara Buddhayana Dharmawira Centre

Halo ${transaksi.namaPembeli},

Terima kasih telah melakukan pembelian merchandise di Vihara BDC. Berikut adalah detail transaksi Anda:

Detail Transaksi:
- Order ID: ${transaksi.midtransOrderId || transaksi._id}
- Tanggal: ${orderDate}
- Status: ${transaksi.status === 'berhasil' || transaksi.status === 'settlement' ? 'Berhasil' : transaksi.status}

Detail Produk:
- Produk: ${merchandise.nama}
- Harga per item: ${formatCurrency(merchandise.harga)}
- Jumlah: ${transaksi.jumlah} item
- Total: ${formatCurrency(transaksi.totalHarga)}

${transaksi.alamatPengiriman ? `Alamat Pengiriman:\n${transaksi.alamatPengiriman}\n` : ''}
Metode Pembayaran:
- Metode: ${transaksi.paymentGateway === 'midtrans' ? 'Midtrans' : transaksi.metodePembayaran || 'Transfer'}
${transaksi.midtransPaymentType ? `- Tipe Pembayaran: ${transaksi.midtransPaymentType}${transaksi.midtransBank ? ` (${transaksi.midtransBank})` : ''}\n` : ''}
${transaksi.midtransVaNumber ? `- Virtual Account: ${transaksi.midtransVaNumber}\n` : ''}

Catatan: Pesanan Anda sedang diproses. Kami akan menghubungi Anda untuk konfirmasi pengiriman.

Jika Anda memiliki pertanyaan, silakan hubungi kami melalui:
Email: info@viharabdc.com | Telepon: (021) 1234-5678

Terima kasih atas dukungan Anda kepada Vihara BDC.
    `;

    const mailOptions = {
      from: `"Vihara BDC" <${fromEmail}>`,
      to: transaksi.email,
      subject: `Konfirmasi Pembelian - ${merchandise.nama} - Vihara BDC`,
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

exports.createMerchandiseTransaksi = async (req, res) => {
  try {
    const { merchandise, namaPembeli, email, nomorTelepon, jumlah, alamatPengiriman } = req.body;
    
    if (!merchandise || !namaPembeli || !jumlah) {
      return res.status(400).json({ message: "Merchandise, nama pembeli, and jumlah are required" });
    }
    
    const merchandiseItem = await Merchandise.findById(merchandise);
    if (!merchandiseItem) {
      return res.status(404).json({ message: "Merchandise not found" });
    }
    
    if (merchandiseItem.status !== 'tersedia') {
      return res.status(400).json({ message: "Merchandise is not available" });
    }
    
    if (merchandiseItem.stok < jumlah) {
      return res.status(400).json({ message: "Insufficient stock" });
    }
    
    const totalHarga = merchandiseItem.harga * jumlah;
    
    const transaksi = new MerchandiseTransaksi({
      merchandise,
      namaPembeli,
      email,
      nomorTelepon,
      jumlah,
      totalHarga,
      alamatPengiriman,
      metodePembayaran: 'midtrans',
      status: 'pending',
      paymentGateway: 'midtrans'
    });
    
    await transaksi.save();
    
    const orderId = `MERCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    transaksi.midtransOrderId = orderId;
    await transaksi.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'MERCHANDISE_TRANSAKSI',
      entityId: transaksi._id,
      entityName: `${namaPembeli} - ${merchandiseItem.nama}`,
      description: `Created merchandise transaction: ${namaPembeli} purchased ${jumlah}x ${merchandiseItem.nama}`,
      details: { 
        namaPembeli,
        merchandise: merchandiseItem.nama,
        jumlah,
        totalHarga,
        status: 'pending'
      }
    });
    
    const snap = getMidtransSnap();
    
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalHarga
      },
      customer_details: {
        first_name: namaPembeli,
        email: email || '',
        phone: nomorTelepon || ''
      },
      item_details: [
        {
          id: merchandiseItem._id.toString(),
          price: merchandiseItem.harga,
          quantity: jumlah,
          name: merchandiseItem.nama
        }
      ]
    };
    
    try {
      const transaction = await snap.createTransaction(parameter);
      const token = transaction.token;
      
      res.status(201).json({
        message: "Transaction created successfully",
        token,
        transaksi
      });
    } catch (midtransError) {
      console.error('Midtrans error:', midtransError);
      transaksi.status = 'gagal';
      await transaksi.save();
      
      await logActivity(req, {
        actionType: 'UPDATE',
        entityType: 'MERCHANDISE_TRANSAKSI',
        entityId: transaksi._id,
        entityName: `${namaPembeli} - ${merchandiseItem.nama}`,
        description: `Merchandise transaction failed: Midtrans error`,
        details: { 
          status: 'gagal',
          error: midtransError.message
        },
        status: 'FAILED'
      });
      
      res.status(500).json({
        message: "Failed to create payment transaction",
        error: midtransError.message
      });
    }
  } catch (err) {
    console.error('Error creating merchandise transaction:', err);
    res.status(500).json({
      message: "Error creating transaction",
      error: err.message
    });
  }
};

exports.getAllMerchandiseTransaksi = async (req, res) => {
  try {
    const transaksi = await MerchandiseTransaksi.find()
      .populate('merchandise', 'nama harga')
      .sort({ tanggalTransaksi: -1 });
    res.json(transaksi);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching transactions",
      error: err.message
    });
  }
};

exports.getMerchandiseTransaksiById = async (req, res) => {
  try {
    const transaksi = await MerchandiseTransaksi.findById(req.params.id)
      .populate('merchandise', 'nama harga gambar');
    
    if (!transaksi) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.json(transaksi);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching transaction",
      error: err.message
    });
  }
};

exports.updateMerchandiseTransaksiStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const transaksi = await MerchandiseTransaksi.findById(req.params.id);
    
    if (!transaksi) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    const oldStatus = transaksi.status;
    
    if (status) transaksi.status = status;
    
    await transaksi.save();
    
    // Log activity for status update
    try {
      await logActivity(req, {
        actionType: 'UPDATE',
        entityType: 'MERCHANDISE_TRANSAKSI',
        entityId: transaksi._id,
        entityName: `${transaksi.namaPembeli} - Transaction`,
        description: `Updated merchandise transaction status from ${oldStatus} to ${status}`,
        details: { 
          oldStatus,
          newStatus: status,
          namaPembeli: transaksi.namaPembeli,
          produk: transaksi.merchandise?.toString() || 'Unknown',
          jumlah: transaksi.jumlah,
          totalHarga: transaksi.totalHarga
        }
      });
    } catch (logError) {
      console.error('Error logging merchandise transaction activity:', logError);
    }
    
    if (status === 'berhasil' || status === 'settlement') {
      const merchandise = await Merchandise.findById(transaksi.merchandise);
      if (merchandise) {
        merchandise.stok = Math.max(0, merchandise.stok - transaksi.jumlah);
        if (merchandise.stok === 0) {
          merchandise.status = 'habis';
        }
        await merchandise.save();
        
        if (oldStatus !== 'berhasil' && oldStatus !== 'settlement') {
          const emailResult = await sendReceiptEmail(transaksi, merchandise);
          if (!emailResult.success) {
            console.warn(`Failed to send receipt email: ${emailResult.error}`);
          }
        }
      }
    }
    
    res.json({
      message: "Transaction status updated successfully",
      transaksi
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating transaction status",
      error: err.message
    });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const { order_id, transaction_status, transaction_id, payment_type, va_numbers } = req.body;
    
    if (!order_id || !order_id.startsWith('MERCH-')) {
      return res.status(200).json({ message: "Not a merchandise transaction" });
    }
    
    const transaksi = await MerchandiseTransaksi.findOne({ midtransOrderId: order_id });
    
    if (!transaksi) {
      return res.status(200).json({ message: "Transaction not found" });
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
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'MERCHANDISE_TRANSAKSI',
      entityId: transaksi._id,
      entityName: `${transaksi.namaPembeli} - Transaction`,
      description: `Webhook updated merchandise transaction status from ${oldStatus} to ${newStatus}`,
      details: { 
        oldStatus,
        newStatus,
        transactionStatus: transaction_status,
        paymentType: payment_type,
        namaPembeli: transaksi.namaPembeli
      }
    });
    
    if (newStatus === 'berhasil' && oldStatus !== 'berhasil') {
      const merchandise = await Merchandise.findById(transaksi.merchandise);
      if (merchandise) {
        merchandise.stok = Math.max(0, merchandise.stok - transaksi.jumlah);
        if (merchandise.stok === 0) {
          merchandise.status = 'habis';
        }
        await merchandise.save();
        
        const emailResult = await sendReceiptEmail(transaksi, merchandise);
        if (!emailResult.success) {
          console.warn(`Failed to send receipt email: ${emailResult.error}`);
        }
      }
    }
    
    res.status(200).json({
      message: "Webhook processed successfully",
      transaksi
    });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(200).json({
      message: "Webhook received",
      error: err.message
    });
  }
};

