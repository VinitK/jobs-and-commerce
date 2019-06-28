module.exports = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        req.flash('signupError', "Signup to access.");
        res.redirect('/signup');
    }
}