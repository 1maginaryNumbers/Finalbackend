const MerchandiseTransaksi = require("../models/merchandiseTransaksi");
const Merchandise = require("../models/merchandise");
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
    
    if (status) transaksi.status = status;
    
    await transaksi.save();
    
    if (status === 'berhasil' || status === 'settlement') {
      const merchandise = await Merchandise.findById(transaksi.merchandise);
      if (merchandise) {
        merchandise.stok = Math.max(0, merchandise.stok - transaksi.jumlah);
        if (merchandise.stok === 0) {
          merchandise.status = 'habis';
        }
        await merchandise.save();
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
    
    if (newStatus === 'berhasil' && oldStatus !== 'berhasil') {
      const merchandise = await Merchandise.findById(transaksi.merchandise);
      if (merchandise) {
        merchandise.stok = Math.max(0, merchandise.stok - transaksi.jumlah);
        if (merchandise.stok === 0) {
          merchandise.status = 'habis';
        }
        await merchandise.save();
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

