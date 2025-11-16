require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");
const { startScheduler } = require("./utils/scheduler");

const app = express();

const allowedOrigins = [
  'https://bdcadmin.vercel.app',
  'https://viharabdc.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  if (req.path === '/api/sumbangan/webhook') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  next();
});

app.use(express.json());

if (fs.existsSync(path.join(__dirname, 'uploads'))) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

if (!process.env.JWT_SECRET) {
  console.log("Warning: JWT_SECRET not set in .env file. Using default secret.");
  process.env.JWT_SECRET = "vihara_management_secret_key_2024";
}

connectDB();

app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/umat", require("./routes/umatRoutes"));
app.use("/api/absensi", require("./routes/absensiRoutes"));
app.use("/api/pengumuman", require("./routes/pengumumanRoutes"));
app.use("/api/kegiatan", require("./routes/kegiatanRoutes"));
app.use("/api/pendaftaran", require("./routes/pendaftaranRoutes"));
app.use("/api/sumbangan", require("./routes/sumbanganRoutes"));
app.use("/api/saran", require("./routes/saranRoutes"));
app.use("/api/galeri", require("./routes/galeriRoutes"));
app.use("/api/info-umum", require("./routes/infoUmumRoutes"));
app.use("/api/merchandise", require("./routes/merchandiseRoutes"));
app.use("/api/struktur", require("./routes/strukturRoutes"));
app.use("/api/activitylog", require("./routes/activityLogRoutes"));
app.use("/api/jadwal", require("./routes/jadwalRoutes"));
app.use("/api/kategori-jadwal", require("./routes/kategoriJadwalRoutes"));
app.use("/api/kategori-galeri", require("./routes/kategoriGaleriRoutes"));

app.use((req, res, next) => {
  console.log('Request from origin:', req.headers.origin);
  next();
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    cors: 'configured'
  });
});


module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startScheduler();
  });
}
