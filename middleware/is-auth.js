module.exports = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        req.flash('loginError', "Login to access.");
        res.redirect('/login');
    }
}