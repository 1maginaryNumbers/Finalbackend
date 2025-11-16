const Umat = require("../models/umat");
const nodemailer = require("nodemailer");

const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'test@ethereal.email',
        pass: 'test'
      }
    });
  }
};

exports.sendBroadcast = async (req, res) => {
  try {
    const { subject, message, recipients } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }
    
    let umatList = [];
    
    if (recipients && recipients.length > 0) {
      umatList = await Umat.find({ _id: { $in: recipients }, email: { $exists: true, $ne: '' } });
    } else {
      umatList = await Umat.find({ email: { $exists: true, $ne: '' } });
    }
    
    if (umatList.length === 0) {
      return res.status(400).json({ message: "No recipients found with email addresses" });
    }
    
    const emailList = umatList.map(umat => umat.email).filter(email => email && email.trim() !== '');
    
    if (emailList.length === 0) {
      return res.status(400).json({ message: "No valid email addresses found" });
    }
    
    const transporter = createTransporter();
    
    const emailPromises = emailList.map(email => {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@vihara.com',
        to: email,
        subject: subject,
        text: message,
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
              ${subject}
            </h2>
            <div style="margin-top: 20px; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 12px;">
              <p>This is an automated message from Vihara Management System.</p>
            </div>
          </div>
        </div>`
      };
      
      return transporter.sendMail(mailOptions).catch(err => {
        console.error(`Failed to send email to ${email}:`, err.message);
        return { error: err.message, email };
      });
    });
    
    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
    const failed = results.length - successful;
    
    res.json({
      message: `Email broadcast completed`,
      totalRecipients: emailList.length,
      successful,
      failed,
      subject,
      message
    });
  } catch (err) {
    console.error("Error sending broadcast:", err);
    res.status(500).json({
      message: "Error sending broadcast",
      error: err.message
    });
  }
};

exports.getUmatForBroadcast = async (req, res) => {
  try {
    const umat = await Umat.find({ email: { $exists: true, $ne: '' } })
      .select('nama email')
      .sort({ nama: 1 });
    
    res.json(umat);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching umat for broadcast",
      error: err.message
    });
  }
};
