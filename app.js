const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const uuidv4 = require('uuidv4');

const errorController = require('./controllers/error');
const shopController = require('./controllers/shop');

const isAuth = require('./middleware/is-auth');
const User = require('./models/user');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const cvfyRoutes = require('./routes/cvfy');
const apiRoutes = require('./routes/api');

const MONGODB_URI =
  'mongodb+srv://vinit:xBj2jtRW8JUIzYHf@cluster0-cx4wp.mongodb.net/shop?retryWrites=true';

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4());
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
  session({
    secret: 'my secret',
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
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    res.status(500).render('500', {
        docTitle: '500',
        error: error,
        isLoggedIn: req.session.isLoggedIn,
    });
});

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useCreateIndex: true })
  .then(result => {
    app.listen(5000);
  })
  .catch(err => {
    console.log(err);
  });