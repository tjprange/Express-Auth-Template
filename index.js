const express = require('express');
const app = express();
const User = require('./models/user'); // Mongo model for user
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // for encrypting/salting passwords
const session = require('express-session'); // for use of session

const flash = require('connect-flash'); // for use of flash
app.use(flash());

const path = require('path');

// connect to mongoose
mongoose
  .connect('mongodb://localhost:27017/login', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to Mongo DB');
  })
  .catch((err) => {
    console.log('Error connecting to Mongo DB');
    console.log(err);
  });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

const sessionOptions = {
  secret: 'badsecret',
  resave: false,
  saveUninitialized: false,
};
app.use(session(sessionOptions));

// middleware for login
const requireLogin = (req, res, next) => {
  // invalid, redirect back to /login
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  // proceed
  next();
};

// home route
app.get('/', (req, res) => {
  res.render('home');
});

// render register views/register
app.get('/register', (req, res) => {
  res.render('register', { messages: req.flash('error') });
});

// create new user, save to DB, set session and redirect to /
app.post('/register', async (req, res) => {
  const { password, username } = req.body;
  const user = new User({ username, password });
  await user.save();
  // set session to mongo id
  req.session.user_id = user._id;
  res.redirect('/');
});

// Login form. Form will redirect to POST /login
app.get('/login', (req, res) => {
  res.render('login');
});

// if the user is valid, redirect to secret page otherwise redirect back to login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const foundUser = await User.findAndValidate(username, password);
    if (foundUser) {
      req.session.user_id = foundUser._id;
      res.redirect('/secret');
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    // user not found
    req.flash('error', 'You must have an account to login');
    res.redirect('/register');
  }
});

app.post('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect('/login');
});

app.get('/secret', requireLogin, (req, res) => {
  res.render('secret');
});

app.get('/topsecret', requireLogin, (req, res) => {
  res.send('TOP SECRET!!!');
});

app.listen(3000, () => {
  console.log('http://localhost:3000');
});
