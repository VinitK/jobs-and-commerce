// default imports

// third party imports
const express = require('express');
const { body } = require('express-validator/check');

// own imports
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

// constants
const router = express.Router();

// middleware - admin  product list
router.get('/products', isAuth, adminController.getProducts);

// middleware - Add Product Page
router.get('/add-product', isAuth, adminController.getAddProduct);

// middleware - Add Product Form Submission
router.post('/add-product', 
                isAuth, 
                [
                    body('title')
                        .trim()
                        .isString().withMessage('Only letters and digits allowed in title.')
                        .isLength({min: 3}).withMessage('Title too short. Enter a longer title!'),
                    body('price', 'Enter a valid price.')
                        .isFloat(),
                    body('description')
                        .trim()
                        .isLength({min: 30, max: 600}).withMessage('Description should be from 30 upto 600 characters!'),
                    body('imageUrl')
                        .isURL(),
                ],
                adminController.postAddProduct);

// middleware - Edit Product Page
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

// middleware - Edit Product Form Submission
router.post('/edit-product', 
                isAuth, 
                [
                    body('title')
                        .isString().withMessage('Only letters and digits allowed in title.')
                        .trim()
                        .isLength({min: 3}).withMessage('Title too short. Enter a longer title!'),
                    body('price', 'Enter a valid price.')
                        .isFloat(),
                    body('description')
                        .trim()
                        .isLength({min: 30, max: 600}).withMessage('Description should be from 30 upto 600 characters!'),
                ],
                adminController.postEditProduct);

// middleware - Delete Product Form Submission
router.delete('/product/:productId', isAuth, adminController.deleteProduct);

// export
module.exports = router;