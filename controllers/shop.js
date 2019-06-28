// default imports
const fs = require('fs');
const path = require('path');

// third party imports
const env = require('dotenv'); // Remove in Heroku
env.config(); // Remove in Heroku
const PDFDocument = require('pdfkit');
const { validationResult } = require('express-validator/check');
const mongoose = require('mongoose');
// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')(process.env.STRIPE_KEY);

// own imports
const Product = require('../models/product');
const Order = require('../models/order');

// constants
const ITEMS_PER_PAGE = 3;

exports.getIndex = async (req, res, next) => {

    // start constants
    const page = +req.query.page || 1; // pagination
    let totalItems; // pagination
    // end constants
    try {
        const numberOfProducts = await Product.find().countDocuments()
        totalItems = numberOfProducts;
        const products = await Product.find()
                        .skip((page-1) * ITEMS_PER_PAGE)
                        .limit(ITEMS_PER_PAGE);
        res.render('shop/index', {
            docTitle: 'Home',
            products: products,
            currentPage: page,
            hasNextPage: (ITEMS_PER_PAGE * page) < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}


exports.getProducts = async (req, res, next) => {
    // start constants
    const page = +req.query.page || 1; // pagination
    let totalItems; // pagination
    // end constants
    try {
        totalItems = await Product.find().countDocuments();
        const products = await Product.find().skip((page-1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);
        res.render('shop/product-list', {
            docTitle: 'Products',
            products: products,
            currentPage: page,
            hasNextPage: (ITEMS_PER_PAGE * page) < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
    } catch (err) {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}

exports.getProduct = (req, res, next) => {
    const productId = req.params.productId;
    Product.findById(productId)
    .populate('comments.userId')
    .exec()
    .then(product => {
        if (product) {
            return res.render('shop/product-details', 
                { 
                    docTitle: product.title,
                    product: product,
                    userId: req.user._id,
                    errorMessage: null,
                    validationErrors: []
                }
            );
        }
        return res.redirect('/products');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postComment = (req, res, next) => { // saving is done. Displaying remaining, deleteing remaining.

    const productId = mongoose.Types.ObjectId(req.body.productId);
    const message = req.body.message;
    const user = req.user;
    const errors = validationResult(req);
    
    
        Product.findById(productId)
        .then(product => {
            if (product){
                if (errors.isEmpty()){
                    product.comments.push({ userId: user, message: message });
                    product.save()
                    .then(product => {
                        console.log('COMMENT ADDED TO PRODUCT!');
                        res.redirect(`/products/${productId}`);
                    }).catch(err => {
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        return next(error);
                    });
                } else {
                    res.status(422).render('shop/product-details', 
                        { 
                            docTitle: product.title,
                            product: product,
                            userId: req.user._id,
                            errorMessage: errors.array()[0].msg,
                            validationErrors: errors.array()
                        }
                    );
                }
            } else {
                throw new Error("Product missing.");
            }
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

// function to export
exports.deleteComment = (req, res, next) => {

    const productId = mongoose.Types.ObjectId(req.params.productId);
    const commentId = req.params.commentId;
    const user = req.user;
    Product.findById(productId)
    .then(product => {
        return product.removeFromComments(commentId, user._id);
    }).then(product => {
        if (product) {
            res.status(200).json({ message: "success" });
        } else {
            throw new Error("Could not delete the comment. Contact us!")
        }
    }).catch(err => {
        if(err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
}

exports.getCart = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        res.render('shop/cart', {
            docTitle: 'My Cart',
            products: user.cart.items,
            cartTotal: user.cart.cartTotal
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postCart = (req, res, next) => {
    const productId = req.body.productId;
    let refProduct;
    Product.findById(productId)
    .then(product => {
        refProduct = product;
        if (req.body.plus==='') {
            return req.user.addToCart(product);
        } else if (req.body.minus==='') {
            return req.user.subtractFromCart(product);
        } else {
            let error = new Error("Invalid request!");
            error.statusCode = 403;
            throw error;
        }
    })
    .then(user => {
        console.log('PRODUCT ADDED TO CART!');
        if (refProduct.cartOfUsers.includes(user._id)){
            console.log("user already there in cartOfUsers.");
        } else {
            refProduct.cartOfUsers.push(user);
            return refProduct.save();
        }
    }).then(() => {
        return res.redirect('/cart');
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postCartDeleteProduct = (req, res, next) => {
    const user = req.user;
    const productId = req.body.productId;
    user.removeFromCart(productId)
    .then(result => {
        return Product.findByIdAndUpdate(
            productId, 
            { $pull: { cartOfUsers: result._id } }, 
            { new: true }
        );
    }).then(product => {
        res.redirect('/cart');
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getCheckout = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .execPopulate()
    .then(user => {;
        res.render('shop/checkout', {
            docTitle: 'Checkout',
            products: user.cart.items,
            cartTotal: user.cart.cartTotal
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postOrder = (req, res, next) => {

    const token = req.body.stripeToken;
    let products;

    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        products = user.cart.items.map(item => {
            return {
                product: { ...item.productId._doc },
                quantity: item.quantity,
                itemTotal: item.itemTotal
            };
        });

        const order = new Order({
            products: products,
            user: {
                name: req.user.name,
                userId: req.user
            },
            orderTotal: user.cart.cartTotal
        });

        return order.save();

    }).then(order => {
        // stripe charge the user start
        const charge = stripe.charges.create({
            amount: order.orderTotal * 100,
            currency: 'inr',
            description: 'Demo Order',
            source: token,
            metadata: { order_id: order._id.toString() }
        });
        // stripe charge the user end
        // map products in cart and go to products and remove user from it
        return req.user.clearCart(products);
    }).then(() => {
        res.redirect('/orders');
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getOrders = (req, res, next) => {
    Order.find({'user.userId': req.user._id})
    .then(orders => {
        res.render('shop/orders', {
            docTitle: 'My Orders',
            orders: orders.reverse()
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getInvoice = (req, res, next) => {
    // find orderById, then compare the order.user.userId to req.user._id, then allow user to access the pdf file requested.
    const orderId = req.params.orderId;
    Order.findById(orderId).then(order => {
        if (order) {
            if(order.user.userId.toString() === req.user._id.toString()) {
                const invoiceName = `invoice-${orderId}.pdf`;
                const invoicePath = path.join('data', 'invoices', invoiceName);
                const pdfDoc = new PDFDocument();
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename: ${invoiceName}`);
                pdfDoc.pipe(fs.createWriteStream(invoicePath));
                pdfDoc.pipe(res);

                pdfDoc.fontSize(26).text("Invoice");
                pdfDoc.fontSize(12).text("------------------------------------------------------------------------------------------------------------");
                order.products.forEach(product => {
                    pdfDoc.fontSize(12).text(`${product.product.title}`);
                    pdfDoc.fontSize(16).text(`${product.quantity} x Rs. ${product.product.price} = Rs. ${product.itemTotal}`);
                });
                pdfDoc.fontSize(12).text("------------------------------------------------------------------------------------------------------------");
                pdfDoc.fontSize(16).text(`Total: Rs. ${order.orderTotal}`, { underline: true });
                pdfDoc.end();
            } else {
                next(new Error('USER UNAUTHORIZED TO ACCESS THIS ASSET.'));
            }
        } else {
            next(new Error('NO SUCH ORDER FOUND.'));
        }
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}