const dotenv = require('dotenv');
const path = require('path');
const { google } = require('googleapis');
const express = require('express');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');

dotenv.config();

const port = process.env.PORT || 9000;
const app = express();

app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client/build')));

const { OAuth2 } = google.auth;
const OAUTH_PLAYGROUND = 'https://developers.google.com/oauthplayground';
const RECAPTCHA_VERIFY = 'https://www.google.com/recaptcha/api/siteverify';

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

const verifyToken = async (token, onSuccess, onError) => {
  try {
    const res = await fetch(
      `${RECAPTCHA_VERIFY}?secret=${process.env.RECAPTCHA_SECRET}&response=${token}`
    );
    const json = await res.json();

    onSuccess(json);
  } catch (err) {
    onError(err);
  }
};

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message, token } = req.body;

  const onSuccess = json => {
    if (!json || !json.success || json.score < 0.5) {
      res.status(500).json({ message: `No bots allowed ⛔` });
    }

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
        res.json({ message: `Email successfully sent ⭕` });
      },
      err => {
        console.log(err);
        res.status(500).json({ message: `Unable to send mail ❌` });
      }
    );
  };

  const onError = () => {
    res.status(500).json({ message: `Unable to verify request ❌` });
  };

  verifyToken(token, onSuccess, onError);
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.listen(port);
console.log(`Email server listening at port ${port}`);
