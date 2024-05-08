const dotenv = require('dotenv')
const express = require('express')
const session = require('express-session')
const authController = require('./controllers/auth.js')
const budgetController = require('./controllers/user.js')
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')
const passUserToView = require('./middleware/pass-user-to-view.js')

const app = express()
dotenv.config()

mongoose.connect(process.env.MONGODB_URI)

app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI
        }),
    })
)
app.use(passUserToView)
app.use('/auth', authController)
app.use('/user', budgetController)


// ================ ROUTES ================== //
// -------------- HOME PAGE ----------------- //
app.get('/', (req, res) => {
    res.render('index.ejs')
})


// ================ SERVER ================== //
mongoose.connection.on('connected', () => {
    console.log('Connected to database...')
})

app.listen(3000, () => {
    console.log('listening on port 3000...')
})
