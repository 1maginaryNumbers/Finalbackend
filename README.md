# 🏛️ Vihara Management System - Backend

A complete backend system for managing a Buddhist temple (Vihara) built with Node.js, Express.js, and MongoDB. This system includes payment integration with Midtrans for donation management.

---

## ⭐ About the Project

**Vihara Management System Backend** is a comprehensive RESTful API designed to assist:

- **Temple Administrators** 👥 - Manage all aspects of temple operations
- **Congregation Members** 🙏 - Access temple information and services
- **Donors** 💰 - Make secure donations through integrated payment gateway

This backend serves as the foundation for both the admin dashboard and public website, providing a one-stop solution for temple management.

---

## 🚀 Features

- 🔐 **Admin Authentication** - Secure login system with JWT tokens
- 📢 **Announcement Management** - Create, read, update, delete announcements
- 📅 **Event Management** - Manage temple events and activities
- ✅ **Registration System** - Event registration with QR code generation
- 📱 **Attendance Tracking** - QR code-based attendance system
- 👥 **Member Management** - Manage congregation members
- 🖼️ **Gallery Management** - Photo and media management with category support
- 💳 **Donation System** - Manage donation events with Midtrans payment integration (QRIS)
- 💰 **Transaction Management** - Track and sync donation transactions with Midtrans
- 💬 **Feedback System** - Handle suggestions and feedback
- 🛍️ **Merchandise Management** - Temple merchandise inventory
- 🏛️ **Organizational Structure** - Manage temple leadership structure
- 📧 **Broadcast System** - Send emails to congregation members
- 📆 **Schedule Management** - Manage temple schedules and categories
- 📊 **Activity Logging** - Track all admin activities with IP address tracking

---

## 🔧 Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing
- **Payment**: Midtrans Client for payment integration
- **QR Codes**: QRCode library for QR code generation
- **File Upload**: Multer for file uploads
- **Email**: Nodemailer for email functionality
- **Scheduling**: Node-cron for scheduled tasks
- **CORS**: Cross-origin resource sharing support

---

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Create a `.env` file in the backend directory with the following variables:

   ### Required Variables
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/vihara_management
   # or
   MONGO_URI=mongodb://localhost:27017/vihara_management
   JWT_SECRET=your_jwt_secret_key_here
   ```

   ### Midtrans Payment Integration
   ```env
   MIDTRANS_SERVER_KEY=your_midtrans_server_key
   MIDTRANS_CLIENT_KEY=your_midtrans_client_key
   MIDTRANS_IS_PRODUCTION=false
   ```

   ### Email Configuration (Optional)
   For Gmail:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=your_email@gmail.com
   ```

   For Custom SMTP:
   ```env
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your_email@example.com
   EMAIL_PASSWORD=your_password
   EMAIL_FROM=your_email@example.com
   ```

   ### Node Environment
   ```env
   NODE_ENV=development
   ```

   ⚠️ **Important**: Never commit the `.env` file to version control. It is already included in `.gitignore`.

4. **Start the server**:
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

   Then, the API will be available at `http://localhost:5000`

---

## 📡 API Endpoints

### 🔐 Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout (protected)
- `POST /api/admin/create` - Create new admin (protected)

### 📢 Announcements (Pengumuman)
- `GET /api/pengumuman` - Get all announcements
- `POST /api/pengumuman` - Create announcement (protected)
- `GET /api/pengumuman/:id` - Get announcement by ID
- `PUT /api/pengumuman/:id` - Update announcement (protected)
- `DELETE /api/pengumuman/:id` - Delete announcement (protected)

### 📅 Events (Kegiatan)
- `GET /api/kegiatan` - Get all events
- `POST /api/kegiatan` - Create event (protected)
- `GET /api/kegiatan/:id` - Get event by ID
- `PUT /api/kegiatan/:id` - Update event (protected)
- `DELETE /api/kegiatan/:id` - Delete event (protected)
- `POST /api/kegiatan/bulk-delete` - Bulk delete events (protected)

### ✅ Registration (Pendaftaran)
- `POST /api/kegiatan/:kegiatanId/daftar` - Register for event
- `GET /api/kegiatan/:kegiatanId/pendaftaran` - Get registrations for event
- `GET /api/pendaftaran` - Get all registrations (protected)
- `GET /api/pendaftaran/check/:kegiatanId/:email` - Check if email is registered for event
- `GET /api/pendaftaran/:id` - Get registration by ID
- `DELETE /api/pendaftaran/:id` - Delete registration (protected)

### 📱 Attendance (Absensi)
- `POST /api/absensi/scan` - Scan QR code for attendance
- `GET /api/absensi` - Get all attendance records (protected)
- `GET /api/absensi/kegiatan/:kegiatanId` - Get attendance by event
- `POST /api/absensi` - Create attendance record (protected)
- `PUT /api/absensi/:id` - Update attendance (protected)
- `DELETE /api/absensi/:id` - Delete attendance (protected)

### 👥 Members (Umat)
- `GET /api/umat` - Get all members (protected)
- `POST /api/umat` - Create member (protected)
- `GET /api/umat/:id` - Get member by ID
- `PUT /api/umat/:id` - Update member (protected)
- `DELETE /api/umat/:id` - Delete member (protected)

### 🖼️ Gallery (Galeri)
- `GET /api/galeri` - Get all gallery items
- `POST /api/galeri` - Create gallery item (protected)
- `GET /api/galeri/:id` - Get gallery item by ID
- `GET /api/galeri/kategori/:kategori` - Get gallery by category
- `PUT /api/galeri/:id` - Update gallery item (protected)
- `DELETE /api/galeri/:id` - Delete gallery item (protected)

### 🏷️ Gallery Categories (Kategori Galeri)
- `GET /api/kategori-galeri` - Get all gallery categories
- `POST /api/kategori-galeri` - Create gallery category (protected)
- `PUT /api/kategori-galeri/:id` - Update gallery category (protected)
- `DELETE /api/kategori-galeri/:id` - Delete gallery category (protected)

### 🏛️ Temple Information (Info Umum)
- `GET /api/info-umum` - Get temple information
- `PUT /api/info-umum` - Update temple information (protected)

### 🛍️ Merchandise
- `GET /api/merchandise` - Get all merchandise
- `POST /api/merchandise` - Create merchandise (protected)
- `GET /api/merchandise/:id` - Get merchandise by ID
- `GET /api/merchandise/kategori/:kategori` - Get merchandise by category
- `PUT /api/merchandise/:id` - Update merchandise (protected)
- `DELETE /api/merchandise/:id` - Delete merchandise (protected)

### 💳 Donations (Sumbangan)
- `GET /api/sumbangan` - Get all donation events
- `POST /api/sumbangan` - Create donation event (protected)
- `GET /api/sumbangan/:id` - Get donation event by ID
- `PUT /api/sumbangan/:id` - Update donation event (protected)
- `DELETE /api/sumbangan/:id` - Delete donation event (protected)
- `GET /api/sumbangan/:id/qris-image` - Get QRIS image for donation event
- `GET /api/sumbangan/:id/qris-string` - Get QRIS string for donation event
- `POST /api/sumbangan/payment` - Create payment transaction
- `POST /api/sumbangan/webhook` - Midtrans webhook endpoint (public)

### 💰 Transactions (Transaksi)
- `POST /api/sumbangan/transaksi` - Create donation transaction
- `GET /api/sumbangan/transaksi` - Get all transactions (protected)
- `PUT /api/sumbangan/transaksi/:id/status` - Update transaction status (protected)
- `POST /api/sumbangan/transaksi/:id/sync` - Sync transaction with Midtrans (protected)
- `POST /api/sumbangan/transaksi/sync-all` - Sync all pending transactions (protected)

### 💬 Feedback (Saran)
- `GET /api/saran` - Get all feedback (protected)
- `POST /api/saran` - Submit feedback
- `GET /api/saran/:id` - Get feedback by ID
- `PUT /api/saran/:id/status` - Update feedback status (protected)
- `DELETE /api/saran/:id` - Delete feedback (protected)

### 🏛️ Organizational Structure (Struktur)
- `GET /api/struktur` - Get organizational structure
- `POST /api/struktur` - Create structure member (protected)
- `GET /api/struktur/:id` - Get structure member by ID
- `PUT /api/struktur/:id` - Update structure member (protected)
- `DELETE /api/struktur/:id` - Delete structure member (protected)

### 📧 Broadcast
- `POST /api/umat/broadcast` - Send broadcast email (protected)
- `GET /api/umat/broadcast/recipients` - Get recipients for broadcast (protected)
- `POST /api/umat/broadcast/test` - Test email configuration (protected)

### 📆 Schedule (Jadwal)
- `GET /api/jadwal` - Get all schedules
- `POST /api/jadwal` - Create schedule (protected)
- `GET /api/jadwal/:id` - Get schedule by ID
- `PUT /api/jadwal/:id` - Update schedule (protected)
- `DELETE /api/jadwal/:id` - Delete schedule (protected)
- `POST /api/jadwal/bulk-delete` - Bulk delete schedules (protected)

### 🏷️ Schedule Categories (Kategori Jadwal)
- `GET /api/kategori-jadwal` - Get all schedule categories
- `POST /api/kategori-jadwal` - Create schedule category (protected)
- `PUT /api/kategori-jadwal/:id` - Update schedule category (protected)
- `DELETE /api/kategori-jadwal/:id` - Delete schedule category (protected)

### 📊 Activity Logs
- `GET /api/activity-logs` - Get all activity logs (protected)

---

## 💳 Midtrans Setup

1. **Create Midtrans Account**: Sign up at [Midtrans](https://midtrans.com)

2. **Get API Keys**: 
   - Log in to [Midtrans Dashboard](https://dashboard.midtrans.com)
   - Go to Settings → Access Keys
   - Copy your Server Key and Client Key

3. **Configure Webhook**:
   - In Midtrans Dashboard, go to Settings → Configuration
   - Set Webhook URL to: `https://your-backend-url.com/api/sumbangan/webhook`
   - Enable notifications for: `settlement`, `capture`, `pending`, `deny`, `cancel`, `expire`

4. **Test in Sandbox**:
   - Use sandbox credentials for testing
   - Set `MIDTRANS_IS_PRODUCTION=false` in `.env`
   - Test payments using [Midtrans Simulator](https://simulator.sandbox.midtrans.com)

5. **Production**:
   - Complete Midtrans verification process
   - Set `MIDTRANS_IS_PRODUCTION=true` in `.env`
   - Update webhook URL to production URL

---

## 🗄️ Database Models

The system includes the following MongoDB models:
- Admin
- Pengumuman (Announcements)
- Kegiatan (Events)
- Pendaftaran (Registrations)
- Absensi (Attendance)
- Umat (Members)
- Galeri (Gallery)
- KategoriGaleri (Gallery Categories)
- InfoUmum (Temple Information)
- Merchandise
- Saran (Feedback)
- Struktur (Organizational Structure)
- Sumbangan (Donations)
- Transaksi (Transactions)
- Jadwal (Schedule)
- KategoriJadwal (Schedule Categories)
- ActivityLog

---

## 🔒 Security Features

- 🔐 Password hashing with bcryptjs
- 🎫 JWT token authentication
- ✅ Input validation
- ⚠️ Error handling
- 🌐 CORS enabled with allowed origins
- 🔑 Environment variable protection

---

## 🚀 Deployment

The backend is configured for deployment on Vercel. The `vercel.json` file contains the deployment configuration.

### Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**:
   - Go to Project Settings → Environment Variables
   - Add all variables from your `.env` file

---

## 📝 Notes

- The webhook endpoint (`/api/sumbangan/webhook`) is public and does not require authentication
- QRIS codes are automatically regenerated after successful payments to maintain reusability
- Transaction statuses are automatically synced with Midtrans via webhook
- File uploads are stored in the `uploads/` directory (excluded from git)
- Activity logs are automatically cleared monthly

---

## 📄 License

This project is created and maintained by Vihara Buddhayana Dharmawira Centre. Licensing details are yet to be determined.
