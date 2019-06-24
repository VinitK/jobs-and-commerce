// default imports

// third party imports

// own imports


// constants


// function to export
exports.getCvfy = (req, res, next) => {
    res.render('cvfy/cvfy', {
        docTitle: 'CVFY',
        resume: req.user.resumeUrl,
        message: null,
        errorMessage: null
    });
}

// function to export
exports.postResume = async (req, res, next) => {
    const resume = req.files['resume'];
    if (resume) {
        try {
            req.user.resumeUrl = resume[0].path.replace("\\" ,"/");
            await req.user.save();
            console.log('RESUME CREATED!');
            res.render('cvfy/cvfy', {
                docTitle: 'CVFY',
                message: "Thank you for trusting in us! Our program begins to find relevant jobs for you. You will be mailed soon.",
                errorMessage: null
            });
        }
        catch (err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(error);
        }
    } else {
        res.status(422).render('cvfy/cvfy', 
            { 
                docTitle: 'CVFY',
                message: null, 
                errorMessage: 'Please make sure the file is of file-type .pdf, .doc, or .docx only.'
            }
        );
    }
};