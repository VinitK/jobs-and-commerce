// default imports


// third party imports
const AWS = require('aws-sdk');
const uuidv4 = require('uuidv4');
const env = require('dotenv'); // Remove in Heroku
env.config(); // Remove in Heroku

// own imports


// constants
const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
})

// function to export
exports.getImage = (req, res, next) => {
    const key = `${req.user._id}/${uuidv4()}.jpeg`;

    s3.getSignedUrl('putObject', 
        {
            Bucket: 'weekay',
            ContentType: 'image/jpeg',
            Key: key
        }, 
        (err, url) => {
            return res.json({ key, url })
        }
    );
}