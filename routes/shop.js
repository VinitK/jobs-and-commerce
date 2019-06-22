// default imports

// third party imports
const express = require('express');
const { body } = require('express-validator/check');

// own imports
const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

// constants
const router = express.Router();

// middleware - index
router.get('/', shopController.getIndex);

// middleware - product
router.get('/products/:productId', shopController.getProduct);

// middleware - product list
router.get('/products', shopController.getProducts);

// middleware - comment on product
router.post('/comment', [
    body('message')
        .isLength({ min:10 }).withMessage('Meesage too short.')
        .isLength({ max: 1000 }).withMessage('Meesage too long. Max 1000 characters allowed.')
        .trim()
], isAuth, shopController.postComment);

// middleware - Delete Comment
router.delete('/comment/:productId/:commentId', isAuth, shopController.deleteComment);

// middleware - cart
router.get('/cart', isAuth, shopController.getCart);

// middleware - cart
router.post('/cart', isAuth, shopController.postCart);

// middleware - cart
router.post('/cart-delete-product', isAuth, shopController.postCartDeleteProduct);

// middleware - checkout
router.get('/checkout', isAuth, shopController.getCheckout);

// middleware - orders
router.get('/orders', isAuth, shopController.getOrders);

// middleware - product
router.get('/orders/:orderId', isAuth, shopController.getInvoice);

// export
module.exports = router;