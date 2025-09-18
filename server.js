require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
