// default packages import

// third party imports
const mongoose = require('mongoose');

// own imports
const Product = require('./product');

const Schema = mongoose.Schema;
const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    products: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Product'
        }
    ],
    cart: {
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                },
                itemTotal: {
                    type: Number,
                    required: true
                }
            }
        ],
        cartTotal: {
            type: Number,
            required: true
        }
    },
    verifyToken: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        required: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    resumeUrl: {
        type: String
    }
}, {timestamps: true});

userSchema.methods.addProduct = function(productId) {
    this.products.push(productId)
    return this.save();
}

userSchema.methods.addToCart = function(product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });
    const updatedCartItems = [...this.cart.items];
    let updatedCartTotal = this.cart.cartTotal;
    if (cartProductIndex >= 0) { // product exists - adding one more
        updatedCartItems[cartProductIndex].quantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].itemTotal = this.cart.items[cartProductIndex].itemTotal + product.price;
    } else { // adding product for the first time in cart
        updatedCartItems.push({
            productId: product._id,
            quantity: 1,
            itemTotal: product.price
        });
    }
    if (this.cart.cartTotal) {
        updatedCartTotal = this.cart.cartTotal + product.price;
    } else {
        updatedCartTotal = product.price;
    }
    this.cart = { items: updatedCartItems, cartTotal: updatedCartTotal }
    return this.save();
}

userSchema.methods.subtractFromCart = function(product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });
    let updatedCartItems = [...this.cart.items];
    if (cartProductIndex >= 0) {
        if (updatedCartItems[cartProductIndex].quantity > 1) {
            updatedCartItems[cartProductIndex].quantity = this.cart.items[cartProductIndex].quantity - 1;
            updatedCartItems[cartProductIndex].itemTotal = this.cart.items[cartProductIndex].itemTotal - product.price;
        } else if (updatedCartItems[cartProductIndex].quantity == 1) {
            updatedCartItems = this.cart.items.filter(item => {
                return item.productId.toString() !== product._id.toString();
            });
        }
        this.cart.cartTotal = this.cart.cartTotal - product.price;
    }
    this.cart.items = updatedCartItems
    return this.save();
}

userSchema.methods.removeFromCart = function(productId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString();
    });
    const deletingProduct = this.cart.items.find(item => {
        return item.productId.toString() === productId.toString();
    });
    this.cart.cartTotal = this.cart.cartTotal - deletingProduct.itemTotal;
    this.cart.items = updatedCartItems;
    return this.save();
}

userSchema.methods.clearCart = function() {
    this.cart.items.forEach(item => {
        Product.findById(item.productId)
        .populate('cartOfUsers')
        .exec()
        .then(product => {
            product.cartOfUsers = product.cartOfUsers.filter(user => {
                return user._id.toString() !== this._id.toString()
            });
            return product.save();
        }).then(product => {
        }).catch(err => console.error(err));
    });
    this.cart = { items: [], cartTotal: 0 };
    this.save();
}

module.exports = mongoose.model('User', userSchema);