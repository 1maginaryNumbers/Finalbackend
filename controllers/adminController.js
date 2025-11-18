const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { logActivity } = require("../utils/activityLogger");

exports.create = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }
    
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(409).json({ message: "Username already exists" });
    }
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const admin = new Admin({ 
      username, 
      password: hashedPassword 
    });
    
    await admin.save();
    
    await logActivity(req, {
      actionType: 'CREATE',
      entityType: 'ADMIN',
      entityId: admin._id,
      entityName: admin.username,
      description: `Created new admin: ${admin.username}`,
      details: { 
        username: admin.username
      }
    });
    
    res.status(201).json({ 
      message: "Admin created successfully", 
      admin: { username: admin.username } 
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Error creating admin", 
      error: err.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }
    
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    await logActivity(req, {
      actionType: 'LOGIN',
      entityType: 'ADMIN',
      entityId: admin._id,
      entityName: admin.username,
      description: `Admin login: ${admin.username}`,
      details: { 
        username: admin.username
      }
    });
    
    res.json({ 
      message: "Login successful", 
      token,
      admin: { username: admin.username } 
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Error during login", 
      error: err.message 
    });
  }
};
