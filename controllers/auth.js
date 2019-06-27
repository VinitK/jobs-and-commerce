// default imports
const crypto = require('crypto');

// third party imports
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator/check');
// const env = require('dotenv');
// env.config();

// own imports
const User = require('../models/user');

// variables
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.NODEMAILER_API
    }
}));

// function to export
exports.getSignup = (req, res, next) => {
    const isLoggedIn = req.session.isLoggedIn;
    if (isLoggedIn) {
        return res.redirect('/');
    }
    let message = req.flash('signupError');
    message = (message.length > 0) ? message[0] : null;
    res.render('auth/signup', {
        docTitle: 'Signup',
        errorMessage: message,
        input: {
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    });
}

// function to export
exports.postSignup = (req, res, next) => {
    const isLoggedIn = req.session.isLoggedIn;
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        if (isLoggedIn) {
            return res.redirect('/');
        } else {
            crypto.randomBytes(32, (err, buffer) => {
                if (err) {
                    console.log(err);
                    req.flash('signupError', 'Something went wrong. Could not send verification mail. Please try again!');
                    return res.redirect('/signup');
                } else {
                    //hash password with bcryptjs
                    bcrypt.hash(password, 12)
                    .then(hashedPassword => {
                        // create user with hashed password
                        const token = buffer.toString('hex');
                        const user = new User(
                            {
                                name: name,
                                email: email,  
                                password: hashedPassword,
                                cart: {
                                    items: [],
                                    cartTotal: 0
                                },
                                verifyToken: token,
                                verified: false
                            }
                        );
                        return user.save();
                    }).then(user => {
                        if (user) {
                            console.log('USER CREATED!');
                            return transporter.sendMail({
                                to: email,
                                from: 'vinit.k.khandelwal@gmail.com',
                                subject: "MOMnPOP: Verify Email",
                                html: `<h1>Verify Email</h1><a href="http://localhost:5000/verify/${user._id.toString()}/${user.verifyToken}">Verify email</a>`
                            });
                        } else {
                            throw new Error("Could not create user. Something went wrong!");
                        }
                    }).then(result => {
                        if (result.message === 'success') {
                            req.flash('loginInfo', 'An email verification link has been sent to your email address. PLEASE CHECK SPAM FOLDER TOO.');
                            res.redirect('/login');
                        } else {
                            req.flash('signupError', 'Something went wrong. Could not register. Please try again!');
                            res.redirect('/signup');
                        }
                    })
                    .catch(err => {
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        return next(error);
                    });
                }
            });
        }
    } else {
        console.log(errors.array());
        res.status(422).render('auth/signup', { 
            docTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            input: {
                name: name,
                email: email,
                password: password,
                confirmPassword: confirmPassword
            },
            validationErrors: errors.array()
        });
    }
}

// function to export
exports.getLogin = (req, res, next) => {
    const isLoggedIn = req.session.isLoggedIn;
    if (isLoggedIn) {
        return res.redirect('/');
    }
    let emessage = req.flash('loginError');
    let smessage = req.flash('loginSuccess');
    let imessage = req.flash('loginInfo');
    emessage = (emessage.length > 0) ? emessage[0] : null;
    smessage = (smessage.length > 0) ? smessage[0] : null;
    imessage = (imessage.length > 0) ? imessage[0] : null;
    res.render('auth/login', { 
        docTitle: 'Login',
        message: {
            error: emessage,
            success: smessage,
            info: imessage
        },
        input: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
}

// function to export
exports.postLogin = (req, res, next) => {
    const isLoggedIn = req.session.isLoggedIn;
    const userEmail = req.body.email;
    const password = req.body.password;
    let verifiedUser;
    if (isLoggedIn) {
        return res.redirect('/');
    } else if (req.body.login==='') {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            User.findOne({
                email: userEmail
            }).then(user => {
                if (user) { // if user found
                    if (user.verified===true){ // if user email is verified
                        verifiedUser = user;
                        return bcrypt.compare(password, user.password)
                    } else {
                        return 'unverified';
                    }
                } else {
                    return 'user not found'
                }
            }).then(result => {
                if (result === true) {
                    req.session.loggedInUser = verifiedUser;
                    req.session.isLoggedIn = true;
                    req.session.save();
                } else if (result === false) {
                    return ['loginError', '/login', 'Invalid password. Try again!']
                } else if (result === 'unverified') {
                    return ['loginError', '/login', 'Email not verified. Please check your inbox to verifiy your email.']
                } else if (result === 'user not found') {
                    return ['signupError', '/signup', 'Email address does not exist. Please register to create a new account.']
                } else {
                    return ['loginError', '/login', 'Error loging in. Please try again!']
                }
            }).then(err => {
                if (err) {
                    if (err[1] === '/login') {
                        res.status(422).render('auth/login', { 
                            docTitle: 'Login',
                            message: {
                                error: err[2],
                                success: null,
                                info: null
                            },
                            input: {
                                email: userEmail,
                                password: password
                            },
                            validationErrors: []
                        });
                    } else if (err[1] === '/signup') {
                        res.status(422).render('auth/signup', {
                            docTitle: 'Signup',
                            errorMessage: err[2],
                            input: {
                                name: '',
                                email: userEmail,
                                password: '',
                                confirmPassword: ''
                            },
                            validationErrors: []
                        });
                    }
                } else {
                    res.redirect('/');
                }
            }).catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
        } else {
            res.status(422).render('auth/login', { 
                docTitle: 'Login',
                message: {
                    error: errors.array()[0].msg,
                    success: null,
                    info: null
                },
                input: {
                    email: userEmail,
                    password: password
                },
                validationErrors: errors.array()
            });   
        }
    } else {
        crypto.randomBytes(32, (err, buffer) => {
            if (err) {
                console.log(err);
                req.flash('loginError', 'Something went wrong. Please try again!');
                return res.redirect('/reset');
            
            } else {

                const token = buffer.toString('hex');
                
                User.findOne({
                    email: userEmail
                }).then(user => {
                    
                    if (user) {

                        user.resetToken = token;
                        user.resetTokenExpiration = Date.now() + 3600000;
                        user.save().then(user => {
                            req.flash('loginInfo', "Password resetting link has been sent to your email address. Please find it in your inbox to reset password.");
                            res.redirect('/login');
                            transporter.sendMail({
                                to: userEmail,
                                from: 'vinit.k.khandelwal@gmail.com',
                                subject: "MOMnPOP: Reset Password",
                                html: `<h1>Reset Email</h1><a href="http://localhost:5000/reset/${user._id.toString()}/${token}">Set New Password</a>`
                            });
                        });

                    } else {
                        
                        req.flash('signupError', 'Email not in use. Signup to get started!');
                        res.redirect('/signup');
                    }
                }).catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
            }
        });
    }
}

// function to export
exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/login');
    });
}

// function to export
exports.getVerify = (req, res, next) => {
    const userId = req.params.userId;
    const token = req.params.verifyToken;
    User.findById(userId)
    .then(user => {
        if (user) {
            if (user.verified === false) {
                if (user.verifyToken === token) {
                    user.verified = true;
                    user.save().then(user => {
                        if (user) {
                            req.flash('loginSuccess', 'Email successfully verified!');
                            res.redirect('/login');
                        } else {
                            req.flash('loginError', 'Something went wrong. Could not verify the user. Please try again!');
                            res.redirect('/login');
                        }
                    }).catch(err => {
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        return next(error);
                    });
                } else {
                    req.flash('loginError', "Link invalid. Contact Support!");
                    res.redirect('/login');
                }
            } else {
                req.flash('loginInfo', 'User already verified!');
                res.redirect('/login');
            }
        } else {
            req.flash('signupError', 'Email not found. Please signup to create a new account!');
            res.redirect('/signup');
        }
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

// function to export
exports.getReset = (req, res, next) => {
    const isLoggedIn = req.session.isLoggedIn;
    if (isLoggedIn) {
        return res.redirect('/');
    }
    const token = req.params.resetToken;
    const userId = req.params.userId;
    User.findById(userId)
    .then(user => {
        if (user) {
            if (user.resetToken === token && user.resetTokenExpiration > Date.now()) {
                let message = req.flash('resetError');
                message = (message.length > 0) ? message[0] : null;
                res.render('auth/reset', {
                    docTitle: 'Reset Password',
                    errorMessage: message,
                    input: {
                        password: '',
                        confirmPassword: '',
                        userId: userId,
                        userName: user.name,
                        resetToken: token,
                    }
                });
            } else {
                req.flash('loginError', "You have crossed the time limit for password resetting. Try 'Forgot Password' again!");
                res.redirect('/login');
            }
        } else {
            req.flash('signupError', "User not found. Signup to create a new account.");
            res.redirect('/signup');
        }
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

// function to export
exports.postReset = (req, res, next) => {
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const resetToken = req.body.resetToken;
    const userId = req.body.userId;
    const userName = req.body.userName;
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        if (password === confirmPassword) {
            User.findById(userId)
            .then(user => {
                if (user) {
                    if (user.resetToken === resetToken && user.resetTokenExpiration > Date.now()) {
                        bcrypt.hash(password, 12)
                        .then(hashedPassword => {
                            user.password = hashedPassword;
                            user.resetTokenExpiration = Date.now();
                            return user.save();
                        }).then(user => {
                            req.flash('loginSuccess', 'Password updated. Login with your new password!');
                            res.redirect('/login');
                            return transporter.sendMail({
                                to: user.email,
                                from: 'vinit.k.khandelwal@gmail.com',
                                subject: "MOMnPOP: Password Updated",
                                html: '<h1>Password Updated</h1><p>Your password is successfully updated.</p>'
                            });
                        }).then(result => {
                            if (result.message === 'success') {
                                console.log("PASSWORD UPDATE CONFIRMATION MAIL SENT SUCCESSFULLY!");
                            } else {
                                console.log("FAILED SENDING PASSWORD UPDATE CONFIRMATION MAIL!");
                            }
                        })
                        .catch(err => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error);
                        });
                    } else {
                        req.flash('loginError', "You have crossed password resetting time limit. Try 'Forgot Password' again!");
                        res.redirect('/login');
                    }
                } else {
                    req.flash('resetError', "User does not exist. Try again!");
                    res.redirect(`/reset/${userId}/${resetToken}`);
                }
            }).catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);});
        } else {
            req.flash('resetError', "Password and Confirm Password are different. Please make sure both passwords are same.");
            res.redirect(`/reset/${userId}/${resetToken}`);
        }
    } else {
        res.status(422).render('auth/reset', {
            docTitle: 'Reset Password',
            errorMessage: errors.array()[0].msg,
            input: {
                password: password,
                confirmPassword: confirmPassword,
                userId: userId,
                userName: userName,
                resetToken: resetToken,
            }
        });
    }
}