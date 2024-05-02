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
// Updates sub-docs based on passed obj
const updateChild = async (parent, child, updatedChild) => {
    // Obtains keys for updated values    
    const childKeys = Object.keys(updatedChild)

    // Loops through keys and updates sub-doc's values
    childKeys.forEach( (key) => {
        child[key] = updatedChild[key]
    })

    // Saves changes at the parent level
    await parent.save()
}


// ================ ROUTES ================== //
// -------------- HOME PAGE ----------------- //
app.get('/', (req, res) => {
    res.render('index.ejs')
})

// ---------------- CATEGORIES -------------- //
app.get('/categories', async (req, res) => {
    const allCategories = await Category.find()
    
    // Define arrays for income and expense based on
    // isIncome
    let incomeCategories = []
    let expenseCategories = []
    
    // Loop through allCategories and push accordingly
    // to sort by isIncome
    allCategories.forEach( (category) => {
        if(category.isIncome) {
            incomeCategories.push(category)
        } else {
            expenseCategories.push(category)
        }
    })
    
    res.render('./category/index.ejs', {
        incomeCategories: incomeCategories,
        expenseCategories: expenseCategories
    })
})

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

app.get('/categories/:id', async (req, res) => {
    const foundCategory = await Category.findById(req.params.id)
    res.render('category/show.ejs', {
        category: foundCategory
    })    
})

// ---------------- ENTRIES ----------------- //
app.get('/entries', async (req, res) => {
    const allEntries = await Entry.find()

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

app.get('/categories/:categoryId/entries/new', async (req, res) => {
    const foundCategory = await Category.findById(req.params.categoryId)
    res.render('entry/new.ejs', {
        category: foundCategory
    })
})

app.post('/categories/:categoryId/entries', async (req, res) => {
    const foundCategory = await Category.findById(req.params.categoryId)
    const newEntry = req.body
    
    // Change input strings to Nums
    newEntry.postedDay = parseInt(newEntry.postedDay)
    newEntry.amount = parseInt(newEntry.amount)
    
    // Pushes new entry to entry array and saves the category
    // changes
    foundCategory.entries.push(newEntry)
    await foundCategory.save()
    
    res.redirect(`/categories/${req.params.categoryId}`)
})

app.get('/categories/:categoryId/entries/:entryId', async (req, res) => {
    const foundCategory = await Category.findById(req.params.categoryId)
    const foundEntry = foundCategory.entries.id(req.params.entryId)

    res.render('entry/show.ejs', {
        category: foundCategory,
        entry: foundEntry
    })
})

app.get('/categories/:categoryId/entries/:entryId/edit', async (req, res) => {
    const foundCategory = await Category.findById(req.params.categoryId)
    const foundEntry = foundCategory.entries.id(req.params.entryId)
    res.render('entry/edit.ejs', {
        category: foundCategory,
        entry: foundEntry
    })
})

app.put('/categories/:categoryId/entries/:entryId', async (req, res) => {
    const foundCategory = await Category.findById(req.params.categoryId)
    const foundEntry = foundCategory.entries.id(req.params.entryId)
    const updatedEntry = req.body

    // Change input strings to Nums
    updatedEntry.postedDay = parseInt(updatedEntry.postedDay)
    updatedEntry.amount = parseInt(updatedEntry.amount)
    
    updateChild(foundCategory, foundEntry, updatedEntry)
    res.redirect(`/categories/${foundCategory._id}/entries/${foundEntry._id}`)
})

app.delete('/entries/:id', async (req, res) => {
    await Entry.findByIdAndDelete(req.params.id)
    res.redirect('/entries')
})


// ================ SERVER ================== //
mongoose.connection.on('connected', () => {
    console.log('Connected to database...')
})

app.listen(3000, () => {
    console.log('listening on port 3000...')
})
