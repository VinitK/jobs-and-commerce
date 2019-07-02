// default imports

// third party imports
const { validationResult } = require('express-validator/check');
const AWS = require('aws-sdk');
const env = require('dotenv'); // Remove in Heroku
env.config(); // Remove in Heroku

// own imports
const Product = require('../models/product');
const fileHelper = require('../util/file');

// constants
let ITEMS_PER_PAGE = 3;
const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: "ap-southeast-1"
});

// function to export
exports.getAddProduct = (req, res, next) => {
    return res.render('admin/edit-product', { 
        docTitle: 'Add Product',
        editing: 'false',
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
}

// function to export
exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const description = req.body.description;
    const price = req.body.price;
    const imageUrl = req.body.imageUrl;
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const product = new Product(
            {
                title: title,  
                description: description, 
                descriptionPreview: description.substring(0,100),
                price: price, 
                imageUrl: imageUrl,
                userId: req.user
            }
        );
        product.save()
        .then(savedProduct => {
            console.log(savedProduct);
            return req.user.addProduct(savedProduct._id);
        }).then(updatedUser => {
            console.log("PRODUCT CREATED");
            res.status(200).json(updatedUser);
        }).catch(err => console.error(err));
    } else {
        res.status(422).json({
            url: 'admin/edit-product', 
            data: { 
                docTitle: 'Add Product',
                editing: 'false',
                product: {
                    title: title,
                    price: price,
                    description: description
                },
                hasError: true,
                errorMessage: errors.array()[0].msg,
                validationErrors: errors.array()
            }
        });
    }
}

exports.getProducts = (req, res, next) => {
    // start constants
    const page = +req.query.page || 1; // pagination
    let totalItems; // pagination
    // end constants

    totalItems = req.user.products.length;

    Product.find({userId: req.user._id})
    .countDocuments()
    .then(numberOfProducts => {    
        totalItems = numberOfProducts;
        return Product.find({userId: req.user._id})
                    .skip((page-1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE);
    }).then(products => {
        const lastPage = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
        if (page>lastPage) {
            res.redirect('/admin/products');
        } else {
            res.render('admin/product-list', {
                docTitle: 'My Store',
                products: products,
                currentPage: page,
                hasNextPage: (ITEMS_PER_PAGE * page) < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: lastPage
            });
        }
    }).catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

// function to export
exports.getEditProduct = async (req, res, next) => {
    const editMode = req.query.edit;
    const productId = req.params.productId;
    try {
        const product = await Product.findById(productId)
        if (product) {
            if (product.userId.toString() === req.user._id.toString()) {
                res.render('admin/edit-product', { 
                    docTitle: 'Edit Product',
                    editing: editMode,
                    product: product,
                    hasError: false,
                    errorMessage: null,
                    validationErrors: []
                });
            } else {
                res.redirect(`/products/${productId}`);
            }
        } else {
            res.redirect(`/products/${productId}`);
        }
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}

// function to export
exports.postEditProduct = async (req, res, next) => {

    const errors = validationResult(req);
    if (errors.isEmpty()) {
        try {
            const product = await Product.findById(req.body.productId)
            if (product.userId.toString() === req.user._id.toString()) {
                product.title = req.body.title;
                product.description = req.body.description;
                product.descriptionPreview = req.body.description.substring(0,100);
                product.price = req.body.price;
                if (req.body.imageUrl) {
                    product.imageUrl = req.body.imageUrl;
                }
                // if (req.files) {
                //     if(req.files['image']){
                //         fileHelper.deleteFile(product.imageUrl);
                //         product.imageUrl = req.files['image'][0].path.replace("\\","/");
                //     }
                // }
                await product.save()
                console.log("UPDATED PRODUCT");
                res.redirect('/admin/products');
            } else {
                res.redirect('/');
            }
        } catch (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }
    } else {
        res.status(422).render('admin/edit-product', { 
            docTitle: 'Edit Product',
            editing: 'true',
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDescription,
                _id: prodId
            },
            hasError: true,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }
}

// function to export
exports.deleteProduct = (req, res, next) => {

    const productId = req.params.productId;
    const user = req.user;
    let foundProduct;

    Product.findOne({_id: productId, userId: user._id})
    .populate('cartOfUsers')
    .exec()
    .then(product => {
        foundProduct = product;
        foundProduct.cartOfUsers.forEach(user => {
            user.removeFromCart(productId);
        });
    }).then(() => {
        // fileHelper.deleteFile(foundProduct.imageUrl); // used with multer
        // START DELETE FROM S3
        const key = foundProduct.imageUrl.split('.com/')[1];
        console.log(key);
        const params = {
            Bucket: process.env.S3_BUCKET,
            Key: key
        }
        return s3.deleteObject(params, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                console.log("Data", data, "Data"); // successful response
            }
        });
        // END DELETE FROM S3
    }).then(url => {
        console.log("URL", url, "URL");
        return Product.deleteOne({ _id: productId, userId: user._id });
    }).then(result => {
        if (result.n > 0) {
            console.log("PRODUCT DELETED!");
            user.products.pull(productId);
            return user.save();
        } else {
            let error = new Error("EITHER USER UNAUTHORIZED TO DELETE OR PRODUCT NOT FOUND");
            error.statusCode = 401;
            throw error;
        }
    }).then(user => {
        res.status(200).json({ message: "success" });
    }).catch(err => {
        if(err.statusCode){
            err.statusCode = 500;
        }
        next(err);
        //res.status(500).json({ message: "fail" });
    });
}