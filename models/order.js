// node packages import

// third party imports
const mongoose = require('mongoose');

// own imports


const Schema = mongoose.Schema;
const orderSchema = new Schema({
    products: [
        {
            product: {
                type: Object,
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
    user: {
        name: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        } 
    },
    orderTotal: {
        type: Number,
        required: true
    }
}, {timestamps: true});

module.exports = mongoose.model('Order', orderSchema);