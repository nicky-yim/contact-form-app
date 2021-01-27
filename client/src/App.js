import React, { useState } from 'react';
import axios from 'axios';
import isEmail from 'validator/lib/isEmail';
import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
      marginTop: theme.spacing(6),
      marginBottom: theme.spacing(6),
      padding: theme.spacing(3),
    },
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(1),
  },
  grid: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  wrapper: {
    position: 'relative',
  },
  buttonProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
}));

const Alert = props => {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
};

const App = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    subject: false,
    message: false,
  });
  const [isSnackbarOpen, setIsSnackOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(true);
  const [message, setMessage] = useState('');
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleChange = field => e => {
    const { value } = e.target;

    setValues({ ...values, [field]: value });
    validate(field, value);
  };

  const handleReset = () => {
    setValues({
      name: '',
      email: '',
      subject: '',
      message: '',
    });

    setErrors({
      name: false,
      email: false,
      subject: false,
      message: false,
    });
  };

  const validate = (field, value) => {
    const isError = !value || (field === 'email' && !isEmail(value));

    setErrors({ ...errors, [field]: isError });
    return !isError;
  };

  const handleSubmit = async () => {
    if (!loading) {
      setLoading(true);

      const isValid = Object.keys(values).every(field =>
        validate(field, values[field])
      );

      if (isValid && executeRecaptcha) {
        const token = await executeRecaptcha('contact');
        const { name, email, subject, message } = values;
        const payload = {
          name,
          email,
          subject,
          message,
          token,
        };

        await axios
          .post(`/api/contact`, payload)
          .then(({ data }) => {
            setMessage(data?.message || 'Message successfully sent');
            setIsSuccess(true);
            handleReset();
          })
          .catch(err => {
            setMessage(err?.response?.data?.message || 'Unable to send message');
            setIsSuccess(false);
          });

        setIsSnackOpen(true);
      }

      setLoading(false);
    }
  };

  const handleClose = (e, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setMessage('');
    setIsSnackOpen(false);
  };

  return (
    <Container maxWidth="sm">
      <CssBaseline />
      <Paper className={classes.paper}>
        <Typography align="center" component="h1" variant="h4">
          Contact Form App
        </Typography>
        <form className={classes.form}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="name"
            label="Name"
            name="name"
            autoFocus
            value={values.name}
            onChange={handleChange('name')}
            error={errors.name}
            helperText={errors.name && 'Name is required'}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            type="email"
            value={values.email}
            onChange={handleChange('email')}
            error={errors.email}
            helperText={errors.email && 'Invalid email'}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="subject"
            label="Subject"
            name="subject"
            value={values.subject}
            onChange={handleChange('subject')}
            error={errors.subject}
            helperText={errors.subject && 'Subject is required'}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            multiline
            rows="5"
            id="message"
            label="Message"
            name="message"
            value={values.message}
            onChange={handleChange('message')}
            error={errors.message}
            helperText={errors.message && 'Message is required'}
          />
          <Grid container spacing={5} justify="center" className={classes.grid}>
            <Grid item>
              <Button variant="contained" size="large" onClick={handleReset}>
                Reset
              </Button>
            </Grid>
            <Grid item>
              <div className={classes.wrapper}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  Submit
                </Button>
                {loading && (
                  <CircularProgress
                    size={24}
                    className={classes.buttonProgress}
                  />
                )}
              </div>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <Snackbar
        open={isSnackbarOpen}
        autoHideDuration={3500}
        onClose={handleClose}
      >
        <Alert severity={isSuccess ? 'success' : 'error'}>{message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default App;
