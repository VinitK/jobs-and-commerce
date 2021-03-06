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
    const resumeUrl = req.body.resumeUrl;
    if (resumeUrl) {
        try {
            req.user.resumeUrl = resumeUrl;
            await req.user.save();
            console.log('RESUME CREATED!');
            res.render('cvfy/cvfy', {
                docTitle: 'CVFY',
                resume: resumeUrl,
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
                resume: null,
                message: null, 
                errorMessage: 'Please make sure the file is of file-type .pdf, .doc, or .docx only.'
            }
        );
    }
};