// default imports


// third party imports
const express = require('express');

// own imports
const uplaodController = require('../controllers/uplaod');
const isAuth = require('../middleware/is-auth');

// constants
const router = express.Router();

// functions
// GET Pre-signed Url for Image in S3
router.get('/prodimage/:filetype/:extension', isAuth, uplaodController.getImage);

// GET Pre-signed Url for Resume in S3
router.get('/resume/:filetype/:extension', isAuth, uplaodController.getResume);

// export
module.exports = router;