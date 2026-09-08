const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ilikefeeling@gmail.com',
    pass: 'yeewfhlpzhbkqsog',
  },
});

async function run() {
  try {
    const info = await transporter.sendMail({
      from: '"RabTube 관리자" <ilikefeeling@gmail.com>',
      to: 'ilikefeeling@gmail.com', // Sending to the admin to see if it arrives
      subject: 'Test Email from Nodemailer',
      text: 'This is a test email to verify SMTP functionality.',
    });
    console.log('Success:', info.response);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
