// default imports


// third party imports
const express = require('express');
const { check, body } = require('express-validator/check');

// own imports
const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

// middleware - GET Signup Page
router.get('/signup', authController.getSignup);

// middleware - POST Signup
router.post('/signup',
            [
                check('email')
                    .isEmail().withMessage('Please enter a valid email.')
                    .custom((value, { req }) => {
                        return User.findOne({
                            email: value
                        }).then(user => {
                            if (user) {
                                return Promise.reject('This email is already registered. Try logging in!');
                            }
                        });
                    })
                    .normalizeEmail(),
                body('password', '')
                    .isLength({min: 6}).withMessage('Password must be of at least 6 characters.')
                    .isAlphanumeric().withMessage('Only letters and digits are allowed in password.')
                    .trim(),
                body('confirmPassword')
                    .trim()
                    .custom((value, { req }) => {
                        if (value === req.body.password) {
                            return true;
                        } else {
                            throw new Error('Password and Confirm Password do not match.');
                        }
                    }),
                body('name', 'Please enter a valid name.')
                    .isLength({ min:3, max: 50 })
                    .isAlpha()
                    .trim()
            ], 
            authController.postSignup);

// middleware - GET Login Page
router.get('/login', authController.getLogin);

// middleware - POST Login
router.post('/login', 
            [
                body('email', 'Please enter a valid email.')
                    .isEmail()
                    .normalizeEmail(),
                body('password')
                    .isLength({min: 6}).withMessage('Password must be of at least 6 characters.')
                    .isAlphanumeric().withMessage('Only letters and digits are allowed in password.')
                    .trim()
            ],
            authController.postLogin);

// middleware - GET Logout Page
router.post('/logout', authController.postLogout);

// middleware - Get Verify
router.get('/verify/:userId/:verifyToken', authController.getVerify);

// middleware - GET Reset Password Page
router.get('/reset/:userId/:resetToken', authController.getReset);

// middleware - POST Reset Password
router.post('/reset', 
            [
                check('userId')
                    .custom((value, { req }) => {
                        return User.findById(value).then(user => {
                            if (!user) {
                                return Promise.reject('User does not exist.');
                            }
                        });
                    }),
                body('password')
                    .isLength({min: 6}).withMessage('Password must be of at least 6 characters.')
                    .isAlphanumeric().withMessage('Only letters and digits are allowed in password.'),
                body('confirmPassword').custom((value, { req }) => {
                    if (value === req.body.password) {
                        return true;
                    } else {
                        throw new Error('Password and Confirm Password do not match.');
                    }
                })
            ],
            authController.postReset);

// export
module.exports = router;