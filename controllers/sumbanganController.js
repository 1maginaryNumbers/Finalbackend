const Sumbangan = require("../models/sumbangan");
const { logActivity } = require("../utils/activityLogger");
const Transaksi = require("../models/transaksi");
const midtransClient = require("midtrans-client");

exports.createSumbangan = async (req, res) => {
  try {
    const { namaEvent, deskripsi, bankName, bankNumber, targetDana, tanggalSelesai } = req.body;
    
    if (!namaEvent || !targetDana || !bankName || !bankNumber) {
      return res.status(400).json({ message: "Nama event, target dana, bank name, and bank number are required" });
    }
    
    let qrisImage = '';
    
    if (req.file && req.file.buffer) {
      const imageBuffer = req.file.buffer;
      const imageBase64 = imageBuffer.toString('base64');
      const mimetype = req.file.mimetype || 'image/jpeg';
      qrisImage = `data:${mimetype};base64,${imageBase64}`;
    }
    
    const sumbangan = new Sumbangan({
      namaEvent,
      deskripsi,
      bankName,
      bankNumber,
      qrisImage,
      targetDana,
      tanggalSelesai
    });
    
    await sumbangan.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'SUMBANGAN',
      entityId: sumbangan._id,
      entityName: sumbangan.namaEvent,
      description: `Created new donation event: ${sumbangan.namaEvent}`,
      details: { 
        namaEvent: sumbangan.namaEvent, 
        targetDana: sumbangan.targetDana,
        bankName: sumbangan.bankName
      }
    });
    
    res.status(201).json({
      message: "Sumbangan created successfully",
      sumbangan
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating sumbangan",
      error: err.message
    });
  }
};

exports.getAllSumbangan = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allSumbangan = await Sumbangan.find()
      .sort({ tanggalMulai: -1 });
    
    const updatedSumbangan = await Promise.all(
      allSumbangan.map(async (item) => {
        if (item.tanggalSelesai && item.status === 'aktif') {
          const endDate = new Date(item.tanggalSelesai);
          endDate.setHours(0, 0, 0, 0);
          
          if (endDate < today) {
            item.status = 'selesai';
            await item.save();
          }
        }
        return item;
      })
    );
    
    const totalSumbangan = updatedSumbangan.length;
    const totalPages = Math.ceil(totalSumbangan / limit);
    const paginatedSumbangan = updatedSumbangan.slice(skip, skip + limit);
    
    res.json({
      sumbangan: paginatedSumbangan,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalSumbangan: totalSumbangan,
        sumbanganPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
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

exports.updateSumbangan = async (req, res) => {
  try {
    const { namaEvent, deskripsi, bankName, bankNumber, targetDana, danaTerkumpul, status, tanggalSelesai } = req.body;
    
    const sumbangan = await Sumbangan.findById(req.params.id);
    
    if (!sumbangan) {
      return res.status(404).json({ message: "Sumbangan not found" });
    }
    
    if (namaEvent) sumbangan.namaEvent = namaEvent;
    if (deskripsi !== undefined) sumbangan.deskripsi = deskripsi;
    if (bankName) sumbangan.bankName = bankName;
    if (bankNumber) sumbangan.bankNumber = bankNumber;
    if (targetDana) sumbangan.targetDana = targetDana;
    if (danaTerkumpul !== undefined) sumbangan.danaTerkumpul = danaTerkumpul;
    if (status) sumbangan.status = status;
    if (tanggalSelesai) sumbangan.tanggalSelesai = tanggalSelesai;
    
    if (req.file && req.file.buffer) {
      const imageBuffer = req.file.buffer;
      const imageBase64 = imageBuffer.toString('base64');
      const mimetype = req.file.mimetype || 'image/jpeg';
      sumbangan.qrisImage = `data:${mimetype};base64,${imageBase64}`;
    }
    
    await sumbangan.save();
    
    res.json({
      message: "Sumbangan updated successfully",
      sumbangan
    });
  } catch (err) {
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
      buktiPembayaran
    });
    
    await transaksi.save();
    
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
    
    const transaksi = await Transaksi.findById(req.params.id);
    
    if (!transaksi) {
      return res.status(404).json({ message: "Transaksi not found" });
    }
    
    if (status) transaksi.status = status;
    
    await transaksi.save();
    
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
    
    if (sumbanganExists.status !== 'aktif') {
      return res.status(400).json({ message: "Donation event is not active" });
    }
    
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
    
    const snap = getMidtransSnap();
    
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
          id: sumbangan._id.toString(),
          price: parseFloat(nominal),
          quantity: 1,
          name: `Donasi - ${sumbanganExists.namaEvent}`
        }
      ]
    };
    
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
    
    if (newStatus === 'berhasil' && oldStatus !== 'berhasil') {
      const sumbangan = await Sumbangan.findById(transaksi.sumbangan);
      if (sumbangan) {
        sumbangan.danaTerkumpul = (sumbangan.danaTerkumpul || 0) + transaksi.nominal;
        await sumbangan.save();
      }
    }
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'TRANSAKSI',
      entityId: transaksi._id,
      entityName: transaksi.namaDonatur,
      description: `Payment webhook received: ${transactionStatus}`,
      details: {
        orderId: orderId,
        transactionStatus: transactionStatus,
        paymentType: statusResponse.payment_type
      }
    });
    
    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({
      message: "Error processing webhook",
      error: err.message
    });
  }
};
