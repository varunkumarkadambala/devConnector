const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route  GET /api/auth/
// @desc   Test API
// @access  PRIVATE
router.get('/', auth, async (req,res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error!")
    }
});

// @route  POST /api/auth/
// @desc   Login a user
// @access  PUBLIC
router.post('/', [
        check('email', 'Enter a valid email').isEmail(),
        check('password','Enter a password').exists()
    ],
    async (req,res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({errors : errors.array()});
        }

        const { email, password} = req.body;

        try{
            // Check if user already exists
            let user = await User.findOne({email});
            if(!user){
                return res.status(400).json({errors : [{msg : 'Invalid Credentials!'}]})
            }

            // Validate the password
            const isMatch = await bcrypt.compare(password,user.password);
            if(!isMatch){
                return res.status(400).json({errors : [{msg : 'Invalid Credentials!'}]})
            }

            // Return jwt
            const payload = {
                user : {
                    id : user.id
                }
            };
            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn : 360000},
                (err, token) => {
                    if(err) throw err;
                    res.json({token})
                }
            );

        } catch(err){
            console.error(err.message);
            res.status(500).send('Server Error')
        }
    }
);

module.exports = router;