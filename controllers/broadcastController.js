const Umat = require("../models/umat");
const nodemailer = require("nodemailer");

const createTransporter = () => {
  let transporter;
  
  if (process.env.EMAIL_SERVICE === 'gmail') {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Gmail configuration requires EMAIL_USER and EMAIL_PASSWORD environment variables');
    }
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else if (process.env.EMAIL_HOST) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('SMTP configuration requires EMAIL_USER and EMAIL_PASSWORD environment variables');
    }
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    console.warn('No email configuration found, using test configuration');
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'test@ethereal.email',
        pass: 'test'
      }
    });
  }
  
  return transporter;
};

const verifyTransporter = async (transporter) => {
  try {
    await transporter.verify();
    console.log('Email transporter verified successfully');
    return { success: true };
  } catch (error) {
    console.error('Email transporter verification failed:', error.message);
    console.error('Full error:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    };
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
    
    console.log(`Preparing to send emails to ${emailList.length} recipients`);
    console.log('Email configuration:', {
      service: process.env.EMAIL_SERVICE || 'custom',
      host: process.env.EMAIL_HOST || 'N/A',
      user: process.env.EMAIL_USER || 'N/A',
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'N/A'
    });
    
    let transporter;
    try {
      transporter = createTransporter();
    } catch (configError) {
      return res.status(500).json({
        message: configError.message || "Email configuration error",
        error: "Configuration error",
        code: "ECONFIG"
      });
    }
    
    const verification = await verifyTransporter(transporter);
    if (!verification.success) {
      let errorMessage = "Email server connection failed. ";
      if (verification.code === 'EAUTH') {
        errorMessage += "Authentication failed. Please check your EMAIL_USER and EMAIL_PASSWORD.";
      } else if (verification.code === 'ECONNECTION' || verification.code === 'ETIMEDOUT') {
        errorMessage += "Cannot connect to email server. Please check your EMAIL_HOST and EMAIL_PORT.";
      } else if (verification.error) {
        errorMessage += verification.error;
      } else {
        errorMessage += "Please check your email configuration.";
      }
      
      return res.status(500).json({ 
        message: errorMessage,
        error: verification.error || "Transporter verification failed",
        code: verification.code,
        details: verification.response
      });
    }
    
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@vihara.com';
    const failedEmails = [];
    const successfulEmails = [];
    
    for (const email of emailList) {
      try {
        const mailOptions = {
          from: `"Vihara Management" <${fromEmail}>`,
          to: email,
          subject: subject,
          text: message,
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                ${subject.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </h2>
              <div style="margin-top: 20px; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 12px;">
                <p>This is an automated message from Vihara Management System.</p>
              </div>
            </div>
          </div>`
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${email}. MessageId: ${info.messageId}`);
        successfulEmails.push({ email, messageId: info.messageId });
      } catch (err) {
        console.error(`Failed to send email to ${email}:`, err.message);
        console.error('Error details:', err);
        failedEmails.push({ email, error: err.message });
      }
    }
    
    const response = {
      message: `Email broadcast completed`,
      totalRecipients: emailList.length,
      successful: successfulEmails.length,
      failed: failedEmails.length,
      successfulEmails: successfulEmails.map(e => e.email),
      failedEmails: failedEmails.map(e => ({ email: e.email, error: e.error }))
    };
    
    if (failedEmails.length > 0) {
      console.warn(`Some emails failed to send:`, failedEmails);
    }
    
    if (successfulEmails.length === 0) {
      return res.status(500).json({
        ...response,
        message: "All emails failed to send. Please check your email configuration and server logs."
      });
    }
    
    res.json(response);
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

exports.testEmail = async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ message: "Test email address is required" });
    }
    
    console.log('Testing email configuration...');
    let transporter;
    try {
      transporter = createTransporter();
    } catch (configError) {
      return res.status(500).json({
        message: configError.message || "Email configuration error",
        error: "Configuration error",
        code: "ECONFIG"
      });
    }
    
    const verification = await verifyTransporter(transporter);
    if (!verification.success) {
      let errorMessage = "Email server connection failed. ";
      if (verification.code === 'EAUTH') {
        errorMessage += "Authentication failed. Please check your EMAIL_USER and EMAIL_PASSWORD.";
      } else if (verification.code === 'ECONNECTION' || verification.code === 'ETIMEDOUT') {
        errorMessage += "Cannot connect to email server. Please check your EMAIL_HOST and EMAIL_PORT.";
      } else if (verification.error) {
        errorMessage += verification.error;
      } else {
        errorMessage += "Please check your email configuration.";
      }
      
      return res.status(500).json({ 
        message: errorMessage,
        error: verification.error || "Transporter verification failed",
        code: verification.code,
        details: verification.response
      });
    }
    
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@vihara.com';
    
    const mailOptions = {
      from: `"Vihara Management" <${fromEmail}>`,
      to: testEmail,
      subject: 'Test Email from Vihara Management System',
      text: 'This is a test email to verify your email configuration.',
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Test Email
          </h2>
          <div style="margin-top: 20px;">
            <p>This is a test email to verify your email configuration.</p>
            <p>If you received this email, your email settings are working correctly.</p>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 12px;">
            <p>This is an automated message from Vihara Management System.</p>
          </div>
        </div>
      </div>`
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Test email sent successfully to ${testEmail}. MessageId: ${info.messageId}`);
    
    res.json({
      message: "Test email sent successfully",
      messageId: info.messageId,
      to: testEmail
    });
  } catch (err) {
    console.error("Error sending test email:", err);
    res.status(500).json({
      message: "Error sending test email",
      error: err.message
    });
  }
};
