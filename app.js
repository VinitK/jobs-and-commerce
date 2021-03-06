const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const helmet = require('helmet'); // security middleware
const compression = require('compression'); // middleware
const env = require('dotenv'); // Remove in Heroku
env.config(); // Remove in Heroku

const errorController = require('./controllers/error');
const shopController = require('./controllers/shop');
const isAuth = require('./middleware/is-auth');
const User = require('./models/user');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const cvfyRoutes = require('./routes/cvfy');
const apiRoutes = require('./routes/api');
const uploadRoutes = require('./routes/upload');

const MONGODB_URI =
  process.env.MONGODB_URI;

const app = express();

app.use(bodyParser.json());

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions'
});

const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(helmet()); // security middleware
app.use(compression()); // compressing code files middleware

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/resumes', express.static(path.join(__dirname, 'resumes')));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

app.use(flash());

app.use((req, res, next) => {
    res.locals.isLoggedIn = req.session.isLoggedIn;
    next();
});

app.use((req, res, next) => {
    if (req.session.isLoggedIn) {
      User.findById(req.session.loggedInUser._id)
      .populate('products')
      .exec()
      .then(user => {
          if (user) {
            req.user = user;
          }
          next();
      })
      .catch(err => {
        console.log(err);
        next(new Error(err));
      });
    } else {
      next();
    }
});

app.post('/create-order', isAuth, shopController.postOrder);

app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken()
  next();
});

app.use('/admin', adminRoutes);
app.use('/cvfy', cvfyRoutes);
app.use('/api', apiRoutes);
app.use('/upload', uploadRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.error(error);
    res.status(500).render('500', {
        docTitle: '500',
        error: "Inform Support"
    });
});

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useCreateIndex: true })
  .then(result => {
    app.listen(process.env.PORT || 5000);
    console.log("Listening on PORT");
  })
  .catch(err => {
    console.error(err);
  });