const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: '3416173320.marelli@gmail.com', // generated ethereal user
    pass: 'mpqlmtllrpfjlzni', // generated ethereal password
  },
  tls: {
    rejectUnauthorized: false
  }
});

module.exports = transporter;
/* const info = await transporter.sendMail({
  from: "'Marelli web' <3416173320.marelli@gmail.com>",
  to: 'personal@marelli.com.ar',
  subject: 'Contacto desde la web',
  html: contentHTML
}); */