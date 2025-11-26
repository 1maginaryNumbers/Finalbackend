const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  user: {
    type: String,
    required: true
  },
  actionType: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['UMAT', 'KEGIATAN', 'PENGUMUMAN', 'GALERI', 'PENDAFTARAN', 'SUMBANGAN', 'SARAN', 'MERCHANDISE', 'MERCHANDISE_TRANSAKSI', 'TRANSAKSI', 'STRUKTUR', 'ABSENSI', 'ADMIN', 'SYSTEM', 'KATEGORI_JADWAL', 'KATEGORI_GALERI', 'JADWAL', 'PAKET_SUMBANGAN', 'PAKET_SUMBANGAN_TRANSAKSI']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  entityName: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  ipAddress: {
    type: String,
    required: true,
    default: 'Unknown'
  },
  userAgent: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS'
  }
}, {
  timestamps: true
});

activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ actionType: 1 });
activityLogSchema.index({ entityType: 1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
