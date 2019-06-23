// node packages import

// third party imports
const mongoose = require('mongoose');

// own imports


const Schema = mongoose.Schema;
const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    descriptionPreview: {
        type: String,
        required: true,
        maxlength: 100
    },
    price: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cartOfUsers: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    comments: [
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            message: {
                type: String,
                required: true
            },
            postedAt: {
                type: Date,
                required: true,
                default: Date.now
            }
        }
    ]
}, {timestamps: true});

productSchema.methods.removeFromComments = function(commentId, userId) {
    const updatedComments = this.comments.filter(comment => {
        return comment._id.toString() !== commentId && comment.userId !== userId;
    });
    this.comments = updatedComments;
    return this.save();
}

module.exports = mongoose.model('Product', productSchema);