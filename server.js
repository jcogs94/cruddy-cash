const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const app = express()

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGODB_URI)

const methodOverride = require('method-override')

app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))
app.use(methodOverride('_method'))


// ================ ROUTES ================== //
app.get('/', (req, res) => {
    res.render('index.ejs')
})

app.get('/entry/new', (req, res) => {
    res.render('entry/new.ejs')
})
// ================ ROUTES ================== //


mongoose.connection.on('connected', () => {
    console.log('Connected to database...')
})

app.listen(3000, () => {
    console.log('listening on port 3000...')
})
