const dotenv = require('dotenv');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const express = require('express');
const nodemailer = require('nodemailer');

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

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

app.post('/api/contact', function (req, res) {
  const { name, from, subject, text } = req.body;

  sendEmail(
    {
      from: `${name} <${from}>`,
      replyTo: from,
      to: process.env.EMAIL_ACCOUNT,
      subject: subject || 'No subject',
      text: text || 'No message',
    },
    info => {
      console.log(info);
      res.json({ success: true });
    },
    err => {
      console.log(err);
      res.status(500).send(err);
    }
  );
});

app.listen(port);
console.log(`Email server listening at port ${port}`);
