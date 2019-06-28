const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
var aws = require('aws-sdk') // upload files
var multer = require('multer') // upload files
var multerS3 = require('multer-s3') // upload files
const uuidv4 = require('uuidv4'); // for naming files with random characters
const helmet = require('helmet'); // security middleware
const compression = require('compression'); // middleware
// const morgan = require('morgan'); // middleware
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

const MONGODB_URI =
  process.env.MONGODB_URI;

const app = express();

const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions'
});

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    
    if (file.fieldname === "resume") { // if uploading resume
      cb(null, 'resumes');
    } else { // else uploading image
      cb(null, 'images');
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname+"-"+uuidv4()+path.extname(file.originalname))
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "resume") {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  } else {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'), 
  { flags: 'a' }
);

app.use(helmet()); // security middleware
app.use(compression()); // compressing code files middleware
// app.use(morgan('combined', { stream: accessLogStream })); // logging requests middleware

app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  multer(
    { 
      storage: fileStorage, 
      limits:
        { 
          fileSize:'2mb' 
        }, 
      fileFilter: fileFilter 
    }
  ).fields(
    [
      { 
        name: 'resume', 
        maxCount: 1 
      }, 
      { 
        name: 'image', 
        maxCount: 1 
      }
    ]
  )
);

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