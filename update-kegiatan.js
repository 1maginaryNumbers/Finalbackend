const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/vihara_bdc_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Kegiatan = require('./models/kegiatan');

async function updateKegiatanData() {
  try {
    console.log('Connected to MongoDB');
    
    // Clear existing kegiatan data
    await Kegiatan.deleteMany({});
    console.log('Cleared existing kegiatan data');
    
    // Insert new Buddhist-themed activities
    const activities = [
      {
        namaKegiatan: "Puja Harian",
        deskripsi: "Puja harian untuk memperkuat spiritualitas dan memulai serta mengakhiri hari dengan doa. Kegiatan ini dilaksanakan setiap hari untuk membangun kebiasaan spiritual yang baik.",
        tanggalMulai: new Date("2024-01-01T06:00:00Z"),
        tanggalSelesai: new Date("2025-12-31T18:00:00Z"),
        waktu: "06:00 & 18:00",
        tempat: "Vihara BDC",
        kapasitas: 100,
        status: "sedang_berlangsung"
      },
      {
        namaKegiatan: "Puja Minggu",
        deskripsi: "Perayaan puja mingguan dengan berbagai waktu untuk memudahkan jadwal umat Buddha. Dilaksanakan setiap hari Minggu dengan rangkaian puja yang lengkap.",
        tanggalMulai: new Date("2025-01-26T08:00:00Z"),
        tanggalSelesai: new Date("2025-01-26T18:00:00Z"),
        waktu: "08:00, 10:00, 11:00, 18:00",
        tempat: "Vihara BDC",
        kapasitas: 150,
        status: "akan_datang"
      },
      {
        namaKegiatan: "Dharma Talk Anak",
        deskripsi: "Pembelajaran Dharma Buddha untuk anak-anak usia 6-12 tahun dengan metode yang menyenangkan dan mudah dipahami. Menggunakan cerita, permainan, dan aktivitas interaktif.",
        tanggalMulai: new Date("2025-02-01T09:00:00Z"),
        tanggalSelesai: new Date("2025-02-01T11:00:00Z"),
        waktu: "09:00 - 11:00",
        tempat: "Aula Dharma",
        kapasitas: 30,
        status: "akan_datang"
      },
      {
        namaKegiatan: "Dharma Talk Dewasa",
        deskripsi: "Pembelajaran Dharma Buddha untuk dewasa yang ingin memperdalam pengetahuan tentang Buddha Dharma. Dibimbing oleh Bhikkhu berpengalaman.",
        tanggalMulai: new Date("2025-02-05T19:00:00Z"),
        tanggalSelesai: new Date("2025-02-05T21:00:00Z"),
        waktu: "19:00 - 21:00",
        tempat: "Aula Dharma",
        kapasitas: 50,
        status: "akan_datang"
      },
      {
        namaKegiatan: "Retret Meditasi",
        deskripsi: "Retret meditasi khusus untuk memperdalam praktik spiritual dan ketenangan batin. Dilaksanakan di lingkungan yang tenang dan mendukung konsentrasi.",
        tanggalMulai: new Date("2025-12-28T09:00:00Z"),
        tanggalSelesai: new Date("2025-12-30T17:00:00Z"),
        waktu: "2 hari 1 malam",
        tempat: "Villa Dharma, Puncak",
        kapasitas: 25,
        status: "akan_datang"
      },
      {
        namaKegiatan: "Bakti Sosial",
        deskripsi: "Kegiatan sosial untuk membantu masyarakat yang membutuhkan. Mengimplementasikan nilai-nilai cinta kasih Buddha dalam kehidupan sehari-hari.",
        tanggalMulai: new Date("2024-12-15T08:00:00Z"),
        tanggalSelesai: new Date("2024-12-15T12:00:00Z"),
        waktu: "08:00 - 12:00",
        tempat: "Berbagai lokasi",
        kapasitas: 40,
        status: "selesai"
      },
      {
        namaKegiatan: "Konser Dharma",
        deskripsi: "Konser musik Dharma dengan berbagai artis dan grup musik Buddha. Menyajikan lagu-lagu spiritual yang menginspirasi dan menenangkan hati.",
        tanggalMulai: new Date("2025-11-15T19:00:00Z"),
        tanggalSelesai: new Date("2025-11-15T21:00:00Z"),
        waktu: "19:00 - 21:00",
        tempat: "Aula Vihara",
        kapasitas: 200,
        status: "akan_datang"
      },
      {
        namaKegiatan: "Seminar Dharma",
        deskripsi: "Seminar dengan pembicara tamu untuk memperdalam pemahaman Buddha Dharma. Menghadirkan tokoh-tokoh berpengalaman dalam bidang spiritual.",
        tanggalMulai: new Date("2025-10-20T09:00:00Z"),
        tanggalSelesai: new Date("2025-10-20T16:00:00Z"),
        waktu: "09:00 - 16:00",
        tempat: "Aula Vihara",
        kapasitas: 80,
        status: "akan_datang"
      }
    ];
    
    const result = await Kegiatan.insertMany(activities);
    console.log(`Inserted ${result.length} activities`);
    
    // Display the inserted activities
    const allActivities = await Kegiatan.find({});
    console.log('\nCurrent activities in database:');
    allActivities.forEach(activity => {
      console.log(`- ${activity.namaKegiatan} (${activity.status})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateKegiatanData();
