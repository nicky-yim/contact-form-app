const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const express = require('express');
const nodeoutlook = require('nodejs-nodemailer-outlook');

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.urlencoded());

const contactAddress = 'test@test.com';

app.post('/contact', function (req, res) {
  nodeoutlook.sendEmail({
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
    from: 'test@outlook.com',
    to: contactAddress,
    subject: 'Test',
    text: 'TEST TEXT',
    onError: e => {
      console.log(e);
      res.status(500).send(e);
    },
    onSuccess: i => {
      console.log(i);
      res.json({ success: true });
    },
  });
});

app.listen(port);
console.log(`Email server listening at port ${port}`);
