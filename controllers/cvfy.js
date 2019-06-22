// default imports

// third party imports

// own imports


// constants


// function to export
exports.getCvfy = (req, res, next) => {

    res.render('cvfy/cvfy', {
        docTitle: 'CVFY'
    });
}

// function to export
exports.postResume = async (req, res, next) => {
    
    const resume = req.file;
    if (resume) {
        try {
            req.user.resumeUrl = resume.path.replace("\\" ,"/");
            await req.user.save();
            console.log('RESUME CREATED!');
            res.redirect('/cvfy');
        }
        catch (err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(error);
        }
    } else {
        res.status(422).render('cvfy', 
            { 
                docTitle: 'CVFY',
                errorMessage: 'Please make sure the file is of file-type .pdf, .doc, or ,.docx only.'
            }
        );
    }
};