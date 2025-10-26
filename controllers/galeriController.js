const Galeri = require("../models/galeri");
const path = require('path');
const { logActivity } = require("../utils/activityLogger");

exports.createGaleri = async (req, res) => {
  try {
    const { judul, deskripsi, kategori } = req.body;
    
    console.log('Request body:', { judul, deskripsi, kategori });
    console.log('Request file:', req.file ? { filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype } : 'No file');
    
    if (!judul) {
      return res.status(400).json({ message: "Judul is required" });
    }
    
    let imageUrl = '';
    
    if (req.file && req.file.buffer) {
      const imageBuffer = req.file.buffer;
      const imageBase64 = imageBuffer.toString('base64');
      const mimetype = req.file.mimetype || 'image/jpeg';
      imageUrl = `data:${mimetype};base64,${imageBase64}`;
      
      const dataUrlLength = imageUrl.length;
      console.log('File uploaded successfully');
      console.log('- Buffer size:', imageBuffer.length, 'bytes');
      console.log('- Base64 length:', imageBase64.length, 'chars');
      console.log('- Full data URL length:', dataUrlLength, 'chars');
      console.log('- MIME type:', mimetype);
      
      if (dataUrlLength > 1000000) {
        console.warn('Large data URL detected (>1MB):', dataUrlLength, 'chars');
      }
    } else if (req.body.url) {
      imageUrl = req.body.url;
    } else {
      return res.status(400).json({ message: "Either image file or URL is required" });
    }
    
    const galeri = new Galeri({
      judul,
      url: imageUrl,
      deskripsi,
      kategori: kategori || 'umum'
    });
    
    await galeri.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'GALERI',
      entityId: galeri._id,
      entityName: galeri.judul,
      description: `Created new galeri image: ${galeri.judul}`,
      details: { 
        judul: galeri.judul, 
        kategori: galeri.kategori,
        url: galeri.url
      }
    });
    
    res.status(201).json({
      message: "Galeri created successfully",
      galeri
    });
  } catch (err) {
    console.error('Error creating galeri:', err);
    res.status(500).json({
      message: "Error creating galeri",
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.getAllGaleri = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const totalImages = await Galeri.countDocuments();
    const totalPages = Math.ceil(totalImages / limit);
    
    const galeri = await Galeri.find()
      .sort({ tanggalUpload: -1 })
      .skip(skip)
      .limit(limit);
    
    const uniqueKategoris = [...new Set(galeri.map(item => item.kategori))];
    console.log(`📊 Total gallery items: ${totalImages}`);
    console.log(`📄 Page ${page} of ${totalPages} (${galeri.length} items)`);
    console.log(`🏷️  Available kategoris: ${uniqueKategoris.join(', ')}`);
    
    res.json({
      images: galeri,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalImages: totalImages,
        imagesPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching galeri",
      error: err.message
    });
  }
};

exports.getGaleriById = async (req, res) => {
  try {
    const galeri = await Galeri.findById(req.params.id);
    
    if (!galeri) {
      return res.status(404).json({ message: "Galeri not found" });
    }
    
    res.json(galeri);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching galeri",
      error: err.message
    });
  }
};

exports.getGaleriByKategori = async (req, res) => {
  try {
    const { kategori } = req.params;
    
    console.log(`🔍 Searching for kategori: "${kategori}"`);
    
    const galeri = await Galeri.find({ 
      kategori: { $regex: kategori, $options: 'i' } 
    }).sort({ tanggalUpload: -1 });
    
    console.log(`📊 Found ${galeri.length} items for kategori "${kategori}"`);
    
    res.json(galeri);
  } catch (err) {
    console.error('❌ Error in getGaleriByKategori:', err.message);
    res.status(500).json({
      message: "Error fetching galeri",
      error: err.message
    });
  }
};

exports.updateGaleri = async (req, res) => {
  try {
    const { judul, url, deskripsi, kategori } = req.body;
    
    const galeri = await Galeri.findById(req.params.id);
    
    if (!galeri) {
      return res.status(404).json({ message: "Galeri not found" });
    }
    
    if (judul) galeri.judul = judul;
    if (url) galeri.url = url;
    if (deskripsi) galeri.deskripsi = deskripsi;
    if (kategori) galeri.kategori = kategori;
    
    // Handle new image upload
    if (req.file) {
      galeri.url = `/uploads/galeri/${req.file.filename}`;
    }
    
    await galeri.save();
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'GALERI',
      entityId: galeri._id,
      entityName: galeri.judul,
      description: `Updated galeri image: ${galeri.judul}`,
      details: { 
        judul: galeri.judul, 
        kategori: galeri.kategori,
        url: galeri.url
      }
    });
    
    res.json({
      message: "Galeri updated successfully",
      galeri
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating galeri",
      error: err.message
    });
  }
};

exports.getGaleriKategoris = async (req, res) => {
  try {
    const galeri = await Galeri.find({}, 'kategori');
    const uniqueKategoris = [...new Set(galeri.map(item => item.kategori))];
    
    res.json({
      kategoris: uniqueKategoris,
      total: uniqueKategoris.length
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching kategoris",
      error: err.message
    });
  }
};

exports.deleteGaleri = async (req, res) => {
  try {
    const galeri = await Galeri.findById(req.params.id);
    
    if (!galeri) {
      return res.status(404).json({ message: "Galeri not found" });
    }
    
    await logActivity(req, {
      actionType: 'DELETE',
      entityType: 'GALERI',
      entityId: galeri._id,
      entityName: galeri.judul,
      description: `Deleted galeri image: ${galeri.judul}`,
      details: { 
        judul: galeri.judul, 
        kategori: galeri.kategori,
        url: galeri.url
      }
    });
    
    await Galeri.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Galeri deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting galeri",
      error: err.message
    });
  }
};
