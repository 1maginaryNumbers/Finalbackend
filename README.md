# Vihara Management System - Backend

A complete backend system for managing a Buddhist temple (Vihara) built with Node.js, Express.js, and MongoDB.

## Features

- **Admin Authentication**: Secure login system with JWT tokens
- **Announcement Management**: Create, read, update, delete announcements
- **Event Management**: Manage temple events and activities
- **Registration System**: Event registration with QR code generation
- **Attendance Tracking**: QR code-based attendance system
- **Member Management**: Manage congregation members
- **Gallery Management**: Photo and media management
- **Donation System**: Manage donation packages and transactions
- **Feedback System**: Handle suggestions and feedback
- **Merchandise Management**: Temple merchandise inventory
- **Organizational Structure**: Manage temple leadership structure
- **Broadcast System**: Send emails to congregation members

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/create` - Create new admin

### Announcements (Pengumuman)
- `GET /api/pengumuman` - Get all announcements
- `POST /api/pengumuman` - Create announcement
- `GET /api/pengumuman/:id` - Get announcement by ID
- `PUT /api/pengumuman/:id` - Update announcement
- `DELETE /api/pengumuman/:id` - Delete announcement

### Events (Kegiatan)
- `GET /api/kegiatan` - Get all events
- `POST /api/kegiatan` - Create event
- `GET /api/kegiatan/:id` - Get event by ID
- `PUT /api/kegiatan/:id` - Update event
- `DELETE /api/kegiatan/:id` - Delete event

### Registration (Pendaftaran)
- `POST /api/kegiatan/:kegiatanId/daftar` - Register for event
- `GET /api/kegiatan/:kegiatanId/pendaftaran` - Get registrations for event
- `GET /api/pendaftaran` - Get all registrations
- `GET /api/pendaftaran/:id` - Get registration by ID
- `DELETE /api/pendaftaran/:id` - Delete registration

### Attendance (Absensi)
- `POST /api/absensi/scan` - Scan QR code for attendance
- `GET /api/absensi` - Get all attendance records
- `GET /api/absensi/kegiatan/:kegiatanId` - Get attendance by event
- `POST /api/absensi` - Create attendance record
- `PUT /api/absensi/:id` - Update attendance
- `DELETE /api/absensi/:id` - Delete attendance

### Members (Umat)
- `GET /api/umat` - Get all members
- `POST /api/umat` - Create member
- `GET /api/umat/:id` - Get member by ID
- `PUT /api/umat/:id` - Update member
- `DELETE /api/umat/:id` - Delete member

### Gallery (Galeri)
- `GET /api/galeri` - Get all gallery items
- `POST /api/galeri` - Create gallery item
- `GET /api/galeri/:id` - Get gallery item by ID
- `GET /api/galeri/kategori/:kategori` - Get gallery by category
- `PUT /api/galeri/:id` - Update gallery item
- `DELETE /api/galeri/:id` - Delete gallery item

### Temple Information (Info Umum)
- `GET /api/info-umum` - Get temple information
- `PUT /api/info-umum` - Update temple information

### Merchandise
- `GET /api/merchandise` - Get all merchandise
- `POST /api/merchandise` - Create merchandise
- `GET /api/merchandise/:id` - Get merchandise by ID
- `GET /api/merchandise/kategori/:kategori` - Get merchandise by category
- `PUT /api/merchandise/:id` - Update merchandise
- `DELETE /api/merchandise/:id` - Delete merchandise

### Donations (Sumbangan)
- `GET /api/sumbangan` - Get all donation packages
- `POST /api/sumbangan` - Create donation package
- `GET /api/sumbangan/:id` - Get donation package by ID
- `PUT /api/sumbangan/:id` - Update donation package
- `DELETE /api/sumbangan/:id` - Delete donation package

### Transactions (Transaksi)
- `POST /api/sumbangan/transaksi` - Create donation transaction
- `GET /api/sumbangan/transaksi` - Get all transactions
- `PUT /api/sumbangan/transaksi/:id/status` - Update transaction status

### Feedback (Saran)
- `GET /api/saran` - Get all feedback
- `POST /api/saran` - Submit feedback
- `GET /api/saran/:id` - Get feedback by ID
- `PUT /api/saran/:id/status` - Update feedback status
- `DELETE /api/saran/:id` - Delete feedback

### Organizational Structure (Struktur)
- `GET /api/struktur` - Get organizational structure
- `POST /api/struktur` - Create structure member
- `GET /api/struktur/:id` - Get structure member by ID
- `PUT /api/struktur/:id` - Update structure member
- `DELETE /api/struktur/:id` - Delete structure member

### Broadcast
- `POST /api/umat/broadcast` - Send broadcast email
- `GET /api/umat/broadcast/recipients` - Get recipients for broadcast

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/vihara_management
JWT_SECRET=your_jwt_secret_key_here
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env` file

3. Start the server:
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

## Database Models

The system includes the following MongoDB models:
- Admin
- Pengumuman (Announcements)
- Kegiatan (Events)
- Pendaftaran (Registrations)
- Absensi (Attendance)
- Umat (Members)
- Galeri (Gallery)
- InfoUmum (Temple Information)
- Merchandise
- Saran (Feedback)
- Struktur (Organizational Structure)
- Sumbangan (Donations)
- Transaksi (Transactions)

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation
- Error handling
- CORS enabled

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- CORS for cross-origin requests
