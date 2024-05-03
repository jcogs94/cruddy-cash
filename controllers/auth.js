const express = require('express')
const router = express.Router()

const bcrypt = require('bcrypt')

const User = require('../models/user.js')


// ================= ROUTES ================ //
router.get('/new-account', (req, res) => {
    res.render('./auth/new-account.ejs')
})

router.post('/new-account', async (req, res) => {
    const emailInDatabase = await User.findOne({ email: req.body.email })

    if (emailInDatabase) {
        res.send('Email already in use!')
    }

    if (req.body.password !== req.body.confirmPassword) {
        res.send('Passwords do not match!')
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10)
    req.body.password = hashedPassword

    const user = await User.create(req.body)
    
    res.send(`Signed up at ${user.email}!\nPassword: ${user.password}`)
})

router.get('/sign-in', async (req, res) => {
    res.render('./auth/sign-in.ejs')
})

router.post('/sign-in', async (req, res) => {
    const emailInDatabase = await User.findOne({ email: req.body.email })

    if (!emailInDatabase) {
        return res.send('Email not registered')
    }

    const validPassword = bcrypt.compareSync(
        req.body.password,
        emailInDatabase.password
    )

    if (!validPassword) {
        return res.send("Invalid password.")
    }

    // console.log(emailInDatabase.);

    req.session.user = {
        username: emailInDatabase.email,
    }

    res.redirect('/')
})

router.get('/sign-out', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})


module.exports = router
