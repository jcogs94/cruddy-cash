const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const app = express()

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGODB_URI)

const methodOverride = require('method-override')

const Category = require('./models/user.js')

app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))
app.use(methodOverride('_method'))


// =============== FUNCTIONS ================ //
const createEntry = async (categoryId, newEntry) => {
    const foundCategory = await Category.findById(monthId)
    foundCategory.entries.push(newEntry)
    await foundCategory.save()
}


// ================ ROUTES ================== //
// Home page
app.get('/', (req, res) => {
    res.render('index.ejs')
})

// ---------------- ENTRIES ----------------- //
app.get('/entries', async (req, res) => {
    const allEntries = await Entry.find();

    // Sorts all entries into arrays by each postedDay value
    let entriesByDay = {}
    allEntries.forEach( (entry) => {
        // Creates array if there isn't one for that postedDay
        if (entriesByDay[entry.postedDay] === undefined) {
            entriesByDay[entry.postedDay] = []
        }

        // Adds entry to array with key value of postedDay
        entriesByDay[entry.postedDay].push(entry)
    })
    
    res.render('entry/index.ejs', {
        entries: entriesByDay,
        entriesKeys: Object.keys(entriesByDay)
    })
})

app.get('/entries/new', (req, res) => {
    res.render('entry/new.ejs')
})

app.post('/entries', async (req, res) => {
    const newEntry = req.body
    
    // Change input strings to Nums
    newEntry.postedDay = parseInt(newEntry.postedDay)
    newEntry.amount = parseInt(newEntry.amount)
    
    await Entry.create(newEntry)
    res.redirect('/entries')
})

app.get('/entries/:id', async (req, res) => {
    const foundEntry = await Entry.findById(req.params.id)
    res.render('entry/show.ejs', {
        entry: foundEntry
    })
})

app.get('/entries/:id/edit', async (req, res) => {
    const foundEntry = await Entry.findById(req.params.id)
    res.render('entry/edit.ejs', {
        entry: foundEntry
    })
})

app.put('/entries/:id', async (req, res) => {
    const updatedEntry = req.body

    // Change input strings to Nums
    updatedEntry.postedDay = parseInt(updatedEntry.postedDay)
    updatedEntry.amount = parseInt(updatedEntry.amount)
    
    await Entry.findByIdAndUpdate(req.params.id, updatedEntry)
    res.redirect('/entries')
})

app.delete('/entries/:id', async (req, res) => {
    await Entry.findByIdAndDelete(req.params.id)
    res.redirect('/entries')
})

// ---------------- CATEGORIES -------------- //
app.get('/categories/new', (req, res) => {
    res.render('category/new.ejs')
})

app.post('/categories', async (req, res) => {
    const newCategory = req.body

    // Changes isIncome type to boolean
    if(newCategory.isIncome === 'true') {
        newCategory.isIncome = true
    } else if(newCategory.isIncome === 'false') {
        newCategory.isIncome = false
    }

    await Category.create(newCategory)
    res.redirect('/')
})


// ================ SERVER ================== //
mongoose.connection.on('connected', () => {
    console.log('Connected to database...')
})

app.listen(3000, () => {
    console.log('listening on port 3000...')
})
