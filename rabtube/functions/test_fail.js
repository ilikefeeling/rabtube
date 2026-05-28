const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ilikefeeling@gmail.com',
    pass: 'dummy-password',
  },
});

async function run() {
  try {
    const info = await transporter.sendMail({
      from: '"RabTube 관리자" <ilikefeeling@gmail.com>',
      to: 'ilikefeeling@gmail.com',
      subject: 'Test Email',
      text: 'This should fail.',
    });
    console.log('Success:', info.response);
  } catch (err) {
    console.error('Error caught:', err.message);
  }
}

run();
