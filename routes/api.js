// default imports

// third party imports
const express = require('express');
const { body } = require('express-validator/check');

// own imports
const apiController = require('../controllers/api');

// constants
const router = express.Router();

// middleware - Get Products
router.get('/products', apiController.getProducts);

// middleware - Add Product
router.post('/product', [
        body('title')
            .trim()
            .isLength({min: 3}).withMessage('Title too short. Enter a longer title!'),
        body('description')
            .trim()
            .isLength({min: 30, max: 600}).withMessage('Description should be from 30 upto 600 characters!'),
        body('price', 'Enter a valid price.')
            .isFloat()
            .trim(),
    ], apiController.postProduct);

// middleware - Get fAIce Page
router.get('/faice', apiController.getFaice);

// middleware - Get API Page
router.get('/', apiController.getAPI);

// export
module.exports = router;