const Umat = require("../models/umat");

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
    
    const emailList = umatList.map(umat => umat.email);
    
    res.json({
      message: "Broadcast prepared successfully",
      totalRecipients: emailList.length,
      recipients: emailList,
      subject,
      message
    });
  } catch (err) {
    res.status(500).json({
      message: "Error preparing broadcast",
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
