const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const app = express()

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGODB_URI)

const methodOverride = require('method-override')

const Entry = require('./models/budget.js')

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

app.post('/entry', async (req, res) => {
    const newEntry = req.body
    newEntry.postedDay = parseInt(newEntry.postedDay)
    newEntry.amount = parseInt(newEntry.amount)
    
    await Entry.create(newEntry)
    res.redirect('/')
})
// ================ ROUTES ================== //


mongoose.connection.on('connected', () => {
    console.log('Connected to database...')
})

app.listen(3000, () => {
    console.log('listening on port 3000...')
})
