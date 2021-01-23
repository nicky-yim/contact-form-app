const dotenv = require('dotenv');
const path = require('path');
const { google } = require('googleapis');
const express = require('express');
const nodemailer = require('nodemailer');

dotenv.config();

const port = process.env.PORT || 9000;
const app = express();

app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client/build')));

const { OAuth2 } = google.auth;
const OAUTH_PLAYGROUND = 'https://developers.google.com/oauthplayground';

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    OAUTH_PLAYGROUND
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject('Failed to retrieve access token');
      }
      resolve(token);
    });
  });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_ACCOUNT,
      accessToken,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
    },
  });

  return transporter;
};

const sendEmail = async (emailOptions, onSuccess, onError) => {
  let emailTransporter = await createTransporter();
  await emailTransporter.sendMail(emailOptions, (err, info) => {
    if (err) {
      onError(err);
    } else {
      onSuccess(info);
    }
  });
};

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  sendEmail(
    {
      from: `${name} <${email}>`,
      replyTo: email,
      to: process.env.EMAIL_ACCOUNT,
      subject: subject || 'No subject',
      text: message || 'No message',
    },
    info => {
      console.log(info);
      res.json({ success: true });
    },
    err => {
      console.log(err);
      res.status(500).json({ success: false, error: err });
    }
  );
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.listen(port);
console.log(`Email server listening at port ${port}`);
