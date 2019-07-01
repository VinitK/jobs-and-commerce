// default imports


// third party imports
const express = require('express');

// own imports
const uplaodController = require('../controllers/uplaod');
const isAuth = require('../middleware/is-auth');

// constants
const router = express.Router();

// functions
// middleware - GET Signup Page
router.get('/image', isAuth, uplaodController.getImage);

// export
module.exports = router;