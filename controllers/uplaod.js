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
});

// function to export
exports.getImage = (req, res, next) => {
    const fileType = req.params.filetype;
    const fileExtension = req.params.extension;
    let ext;
    console.log(fileType);
    console.log(fileExtension);
    if (fileType === "image" && ["jpeg", "jpg", "png"].includes(fileExtension)) {
        ext = fileExtension;
    } else {
        throw new Error("Invalid File Type");
    }
    const key = `${req.user._id}/${uuidv4()}.${ext}`;
    
    s3.getSignedUrl('putObject', 
        {
            Bucket: process.env.S3_BUCKET,
            ContentType: `${fileType}/${fileExtension}`,
            Key: key
        }, 
        (err, url) => {
            if (err) {
                return res.json({message: "fail", error: err});
            } else {
                return res.json({ message: "success", url: url });
            }
        }
    );
}

// function to export
exports.getResume = (req, res, next) => {
    const fileType = req.params.filetype;
    const fileExtension = req.params.extension;
    let ext;
    console.log(fileType);
    console.log(fileExtension);
    if (fileType === "application") {
        if (fileExtension === "msword") {
            ext = "doc"; 
        } else if (fileExtension === "vnd.openxmlformats-officedocument.wordprocessingml.document") {
            ext = "docx";
        } else if (fileExtension === "pdf") {
            ext = "pdf";
        } else {
            throw new Error("Invalid File Type");
        }
    } else {
        throw new Error("Invalid File Type");
    }
    const key = `${req.user._id}/${uuidv4()}.${ext}`;
    
    s3.getSignedUrl('putObject', 
        {
            Bucket: process.env.S3_BUCKET,
            ContentType: `${fileType}/${fileExtension}`,
            Key: key
        }, 
        (err, url) => {
            if (err) {
                return res.json({message: "fail", error: err});
            } else {
                return res.json({ message: "success", url: url });
            }
        }
    );
}