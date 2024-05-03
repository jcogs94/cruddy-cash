const dotenv = require('dotenv')
const express = require('express')
const session = require('express-session')
const authController = require('./controllers/auth.js')
const budgetController = require('./controllers/budgets.js')
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')
const isSignedIn = require('./middleware/is-signed-in.js')
const passUserToView = require('./middleware/pass-user-to-view.js')
const User = require('./models/user.js')

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
app.use('/user-budgets', budgetController)


// ================ ROUTES ================== //
// -------------- HOME PAGE ----------------- //
app.get('/', (req, res) => {
    res.render('index.ejs')
})

app.get('/dashboard', isSignedIn, (req, res) => {
    res.render('./user/index.ejs')
})

// ------------------ BUDGETS --------------- //



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

app.get('/budgets/:budgetId/categories/:categoryId/entries/new', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    res.render('entry/new.ejs', {
        budget: foundBudget,
        category: foundCategory
    })
})

app.post('/budgets/:budgetId/categories/:categoryId/entries', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    const newEntry = req.body
    
    // Change input strings to Nums
    newEntry.postedDay = parseInt(newEntry.postedDay)
    newEntry.amount = parseInt(newEntry.amount)
    
    // Pushes new entry to entry array and saves the category
    // changes
    foundCategory.entries.push(newEntry)
    await foundBudget.save()

    // Updates budget planned and total values with entry added
    // by user
    await updateBudget(foundBudget)
    
    res.redirect(`/budgets/${req.params.budgetId}/categories/${req.params.categoryId}`)
})

app.get('/budgets/:budgetId/categories/:categoryId/entries/:entryId', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    const foundEntry = foundCategory.entries.id(req.params.entryId)

    res.render('entry/show.ejs', {
        budget: foundBudget,
        category: foundCategory,
        entry: foundEntry
    })
})

app.get('/budgets/:budgetId/categories/:categoryId/entries/:entryId/edit', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    const foundEntry = foundCategory.entries.id(req.params.entryId)

    res.render('entry/edit.ejs', {
        budget: foundBudget,
        category: foundCategory,
        entry: foundEntry
    })
})

app.put('/budgets/:budgetId/categories/:categoryId/entries/:entryId', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    const foundEntry = foundCategory.entries.id(req.params.entryId)
    const updatedEntry = req.body
    
    // Change input strings to Nums
    updatedEntry.postedDay = parseInt(updatedEntry.postedDay)
    updatedEntry.amount = parseInt(updatedEntry.amount)
    
    // Updates budget with changes made to entry
    await updateChild(foundBudget, foundEntry, updatedEntry)

    // Updates budget planned and total values with entry
    // updated by user
    updateBudget(foundBudget)

    res.redirect(`/budgets/${foundBudget._id}/categories/${foundCategory._id}/entries/${foundEntry._id}`)
})

app.delete('/budgets/:budgetId/categories/:categoryId/entries/:entryId', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    
    foundCategory.entries.pull(req.params.entryId)
    await foundBudget.save()

    // Updates budget planned and total values with entry
    // deleted by user
    await updateBudget(foundBudget)
    
    res.redirect(`/budgets/${foundBudget._id}/categories/${foundCategory._id}`)
})


// ================ SERVER ================== //
mongoose.connection.on('connected', () => {
    console.log('Connected to database...')
})

app.listen(3000, () => {
    console.log('listening on port 3000...')
})
