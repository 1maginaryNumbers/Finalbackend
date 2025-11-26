const FAQ = require("../models/faq");
const { logActivity } = require("../utils/activityLogger");

exports.createFAQ = async (req, res) => {
  try {
    const { pertanyaan, jawaban, urutan, status } = req.body;
    
    if (!pertanyaan || !jawaban) {
      return res.status(400).json({ message: "Pertanyaan and jawaban are required" });
    }
    
    const faq = new FAQ({
      pertanyaan,
      jawaban,
      urutan: urutan || 0,
      status: status || 'aktif'
    });
    
    await faq.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'FAQ',
      entityId: faq._id,
      entityName: faq.pertanyaan,
      description: `Created new FAQ: ${faq.pertanyaan}`,
      details: { 
        pertanyaan: faq.pertanyaan
      }
    });
    
    res.status(201).json({
      message: "FAQ created successfully",
      faq
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating FAQ",
      error: err.message
    });
  }
};

exports.getAllFAQ = async (req, res) => {
  try {
    const statusFilter = req.query.status;
    const query = statusFilter ? { status: statusFilter } : {};
    
    const faqs = await FAQ.find(query)
      .sort({ urutan: 1, createdAt: -1 });
    
    res.json(faqs);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching FAQ",
      error: err.message
    });
  }
};

exports.getPublicFAQ = async (req, res) => {
  try {
    const faqs = await FAQ.find({ status: 'aktif' })
      .sort({ urutan: 1, createdAt: -1 });
    
    res.json(faqs);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching FAQ",
      error: err.message
    });
  }
};

exports.getFAQById = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }
    
    res.json(faq);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching FAQ",
      error: err.message
    });
  }
};

exports.updateFAQ = async (req, res) => {
  try {
    const { pertanyaan, jawaban, urutan, status } = req.body;
    
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }
    
    if (pertanyaan) faq.pertanyaan = pertanyaan;
    if (jawaban) faq.jawaban = jawaban;
    if (urutan !== undefined) faq.urutan = urutan;
    if (status) faq.status = status;
    
    await faq.save();
    
    await logActivity(req, {
      actionType: 'UPDATE',
      entityType: 'FAQ',
      entityId: faq._id,
      entityName: faq.pertanyaan,
      description: `Updated FAQ: ${faq.pertanyaan}`,
      details: { 
        pertanyaan: faq.pertanyaan
      }
    });
    
    res.json({
      message: "FAQ updated successfully",
      faq
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating FAQ",
      error: err.message
    });
  }
};

exports.deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }
    
    await logActivity(req, {
      actionType: 'DELETE',
      entityType: 'FAQ',
      entityId: faq._id,
      entityName: faq.pertanyaan,
      description: `Deleted FAQ: ${faq.pertanyaan}`,
      details: { 
        pertanyaan: faq.pertanyaan
      }
    });
    
    await FAQ.findByIdAndDelete(req.params.id);
    
    res.json({ message: "FAQ deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting FAQ",
      error: err.message
    });
  }
};

