const PaketSumbangan = require("../models/paketSumbangan");
const PaketSumbanganTransaksi = require("../models/paketSumbanganTransaksi");
const { logActivity } = require("../utils/activityLogger");
const midtransClient = require("midtrans-client");

const getMidtransSnap = () => {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  return new midtransClient.Snap({
    isProduction: isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
  });
};

exports.createPaketSumbangan = async (req, res) => {
  try {
    const { namaPaket, deskripsi, nominal, detailBarang, status, tanggalMulai, tanggalSelesai, stok } = req.body;
    
    if (!namaPaket || !nominal) {
      return res.status(400).json({ message: "Nama paket and nominal are required" });
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
      detailBarang: detailBarang || [],
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
    if (detailBarang) paketSumbangan.detailBarang = detailBarang;
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
      const paket = await PaketSumbangan.findById(transaksi.paketSumbangan);
      if (paket) {
        paket.terjual = (paket.terjual || 0) + 1;
        await paket.save();
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
      const paket = await PaketSumbangan.findById(transaksi.paketSumbangan);
      if (paket) {
        paket.terjual = (paket.terjual || 0) + 1;
        await paket.save();
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

