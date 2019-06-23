// default imports

// third party imports
const { validationResult } = require('express-validator/check');

// own imports
const Product = require('../models/product');

// constants


// function to export
exports.getAPI = (req, res, next) => {
    res.render('api/api', { 
        docTitle: 'REST APIs'
    });
}

// function to export
exports.getProducts = (req, res, next) => {
    Product.find().then(products => {
        res.status(200).json({ data: products, status: 200 });
    }).catch(err => {
        res.status(404).json(err);
    });
};

// function to export
exports.postProduct = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const title = req.body.title;
        const description = req.body.description;
        const price = req.body.price;
        // create post in db
        res.status(201).json({
            message: "success!",
            data: {
                title: title, 
                description: description, 
                price: price 
            }
        });
    } else {
        res.status(422).json(
            { 
                message: "Validation failed, entered data is incorrect.", 
                errors: errors.array() 
            }
        )
    }
};

// function to export
exports.getFaice = (req, res, next) => {
    res.render('api/faice', { 
        docTitle: 'fAIce'
    });
}