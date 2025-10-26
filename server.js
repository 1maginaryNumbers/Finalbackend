require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");
const { startScheduler } = require("./utils/scheduler");

const app = express();

const corsOptions = {
  origin: [
    'https://bdcadmin.vercel.app',
    'https://bdctemple.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
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

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    cors: 'configured'
  });
});

app.options('*', (req, res) => {
  res.sendStatus(200);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startScheduler();
});
