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

    req.session.user = {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        budgets: user.budgets,
        currentBudgetId: user.currentBudgetId
    }

    req.session.save(() => {
        res.redirect('/user/dashboard')
    })
})

router.get('/sign-in', async (req, res) => {
    res.render('./auth/sign-in.ejs')
})

router.post('/sign-in', async (req, res) => {
    const foundUser = await User.findOne({ email: req.body.email })

    if (!foundUser) {
        return res.send('Email not registered')
    }

    const validPassword = bcrypt.compareSync(
        req.body.password,
        foundUser.password
    )

    if (!validPassword) {
        return res.send("Invalid password.")
    }

    req.session.user = {
        _id: foundUser._id,
        email: foundUser.email,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        budgets: foundUser.budgets,
        currentBudget: foundUser.currentBudget
    }

    req.session.save(() => {
        res.redirect('/user/dashboard')
    })
})

router.get('/sign-out', async (req, res) => {
    req.session.destroy(() => {
        res.redirect('/')
    })
})


module.exports = router
