// default imports

// third party imports
const express = require('express');

// own imports
const cvfyController = require('../controllers/cvfy');
const isAuth = require('../middleware/is-auth');
const isAuthSignup = require('../middleware/is-auth-signup');
// constants
const router = express.Router();

// middleware - Get CVFY Page
router.get('/', isAuthSignup, cvfyController.getCvfy);

// middleware - Add Product
router.post('/resume', isAuth, cvfyController.postResume);

// export
module.exports = router;