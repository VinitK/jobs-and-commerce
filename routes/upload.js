// default imports


// third party imports
const express = require('express');

// own imports
const uplaodController = require('../controllers/uplaod');
const isAuth = require('../middleware/is-auth');

// constants
const router = express.Router();

// functions
// GET Pre-signed Url for Image
router.get('/image', isAuth, uplaodController.getImage);

// export
module.exports = router;