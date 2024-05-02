const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const app = express()

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGODB_URI)

const methodOverride = require('method-override')

const Budget = require('./models/user.js')

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

// ------------------ BUDGETS --------------- //
app.get('/budgets', async (req, res) => {
    const allBudgets = await Budget.find()
    
    let budgetsByYear = {}
    
    // Loop through allCategories and push accordingly
    // to sort by isIncome
    allBudgets.forEach( (budget) => {
        if(budgetsByYear[budget.year] === undefined) {
            budgetsByYear[budget.year] = []
        }
        
        budgetsByYear[budget.year].push(budget)
    })
    
    const budgetYears = Object.keys(budgetsByYear)

    res.render('./budget/index.ejs', {
        budgets: budgetsByYear,
        years: budgetYears
    })
})

app.get('/budgets/new', (req, res) => {
    res.render('budget/new.ejs')
})

app.post('/budgets', async (req, res) => {
    const newBudget = req.body
    
    // Creates a name for the budget based on year and month
    newBudget.name = newBudget.month + ' ' + newBudget.year

    // Declarations for model compliance
    newBudget.year = parseInt(newBudget.year)
    newBudget.incomePlanned = parseInt(newBudget.incomePlanned)
    newBudget.expensesPlanned = parseInt(newBudget.expensesPlanned)
    newBudget.incomeTotal = 0
    newBudget.expensesTotal = 0
    
    await Budget.create(newBudget)
    res.redirect('/budgets')
})

app.get('/budgets/:budgetId', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    res.render('budget/show.ejs', {
        budget: foundBudget
    })    
})

app.get('/budgets/:budgetId/edit', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    res.render('budget/edit.ejs', {
        budget: foundBudget
    })
})

app.put('/budgets/:budgetId', async (req, res) => {
    const updatedBudget = req.body
    
    // Creates a name for the budget based on year and month
    updatedBudget.name = updatedBudget.month + ' ' + updatedBudget.year

    // Type changes for model compliance
    updatedBudget.year = parseInt(updatedBudget.year)
    updatedBudget.incomePlanned = parseInt(updatedBudget.incomePlanned)
    updatedBudget.expensesPlanned = parseInt(updatedBudget.expensesPlanned)
    
    await Budget.findByIdAndUpdate(req.params.budgetId, updatedBudget)
    res.redirect('/budgets')
})

app.delete('/budgets/:budgetId', async (req, res) => {
    await Budget.findByIdAndDelete(req.params.budgetId)
    res.redirect('/budgets')
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

app.get('/budgets/:budgetId/categories/new', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    res.render('category/new.ejs', {
        budget: foundBudget
    })
})

app.post('/budgets/:budgetId/categories', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    const newCategory = req.body
    
    // Changes isIncome type to boolean
    if(newCategory.isIncome === 'true') {
        newCategory.isIncome = true
    } else if(newCategory.isIncome === 'false') {
        newCategory.isIncome = false
    }
    
    // Pushes new entry to entry array and saves the category
    // changes
    foundBudget.categories.push(newCategory)
    await foundBudget.save()
    
    res.redirect(`/budgets/${req.params.budgetId}`)
})

app.get('/budgets/:budgetId/categories/:categoryId', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)

    res.render('category/show.ejs', {
        budget: foundBudget,
        category: foundCategory
    })
})

app.get('/budgets/:budgetId/categories/:categoryId/edit', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    
    res.render('category/edit.ejs', {
        budget: foundBudget,
        category: foundCategory
    })
})

app.put('/budgets/:budgetId/categories/:categoryId', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    const updatedCategory = req.body
    
    // Changes isIncome type to boolean
    if(updatedCategory.isIncome === 'true') {
        updatedCategory.isIncome = true
    } else if(updatedCategory.isIncome === 'false') {
        updatedCategory.isIncome = false
    }

    updateChild(foundBudget, foundCategory, updatedCategory)
    res.redirect(`/budgets/${req.params.budgetId}/categories/${req.params.categoryId}`)
})

app.delete('/budgets/:budgetId/categories/:categoryId', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    
    foundBudget.categories.pull(req.params.categoryId)
    await foundBudget.save()
    
    res.redirect(`/budgets/${req.params.budgetId}`)
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
    const foundCategory = await Category.findById(req.params.categoryId)
    const foundEntry = foundCategory.entries.id(req.params.entryId)
    res.render('entry/edit.ejs', {
        category: foundCategory,
        entry: foundEntry
    })
})

app.put('/budgets/:budgetId/categories/:categoryId/entries/:entryId', async (req, res) => {
    const foundCategory = await Category.findById(req.params.categoryId)
    const foundEntry = foundCategory.entries.id(req.params.entryId)
    const updatedEntry = req.body
    
    // Change input strings to Nums
    updatedEntry.postedDay = parseInt(updatedEntry.postedDay)
    updatedEntry.amount = parseInt(updatedEntry.amount)
    
    updateChild(foundCategory, foundEntry, updatedEntry)
    res.redirect(`/categories/${foundCategory._id}/entries/${foundEntry._id}`)
})

app.delete('/budgets/:budgetId/categories/:categoryId/entries/:entryId', async (req, res) => {
    const foundCategory = await Category.findById(req.params.categoryId)
    
    foundCategory.entries.pull(req.params.entryId)
    await foundCategory.save()
    
    res.redirect(`/categories/${foundCategory._id}`)
})


// ================ SERVER ================== //
mongoose.connection.on('connected', () => {
    console.log('Connected to database...')
})

app.listen(3000, () => {
    console.log('listening on port 3000...')
})
