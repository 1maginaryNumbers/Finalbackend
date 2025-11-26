const Sumbangan = require("../models/sumbangan");
const { logActivity } = require("../utils/activityLogger");
const Transaksi = require("../models/transaksi");
const midtransClient = require("midtrans-client");
const QRCode = require("qrcode");

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
      entityName: `${transaksi.namaDonatur} - ${transaksi.sumbangan?.namaEvent || 'Donation'}`,
      description: `Updated donation transaction status from ${oldStatus} to ${status}`,
      details: { 
        oldStatus,
        newStatus: status,
        namaDonatur: transaksi.namaDonatur,
        nominal: transaksi.nominal,
        sumbangan: transaksi.sumbangan?.namaEvent || 'Unknown'
      }
    });
    
    if (status === 'berhasil' || status === 'settlement') {
      const sumbangan = await Sumbangan.findById(transaksi.sumbangan);
      if (sumbangan) {
        sumbangan.danaTerkumpul = (sumbangan.danaTerkumpul || 0) + transaksi.nominal;
        await sumbangan.save();
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
