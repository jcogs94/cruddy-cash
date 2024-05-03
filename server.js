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
// Updates sub-docs based on passed parent model
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

// Updates all planned and total values for a budget
const updateBudget = async (budgetId) => {
    const foundBudget = await Budget.findById(budgetId)
    let newIncomePlanned = 0
    let newIncomeTotal = 0
    let newExpensesPlanned = 0
    let newExpensesTotal = 0

    foundBudget.categories.forEach( (category) => {
        let total = 0
        
        // Adds each entry amount to a total for
        // that category
        category.entries.forEach( (entry) => {
            total += entry.amount
        })
        
        // Saves total value for category
        category.total = total

        // Adds to the planned and total values
        // based on income/expense
        if (category.isIncome) {
            newIncomePlanned += category.planned
            newIncomeTotal += category.total
        } else {
            newExpensesPlanned += category.planned
            newExpensesTotal += category.total
        }
    })

    // Updates all new values and saves
    foundBudget.incomePlanned = newIncomePlanned
    foundBudget.incomeTotal = newIncomeTotal
    foundBudget.expensesPlanned = newExpensesPlanned
    foundBudget.expensesTotal = newExpensesTotal
    await foundBudget.save()
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
    
    // Splits the "month" input type into month and year
    let monthInput = newBudget.month.split('-')
    let monthNumStr = monthInput.pop()
    let month = parseInt(monthNumStr)
    newBudget.year = parseInt(monthInput.pop())
    
    // Changes the month Number to a String
    switch (month) {
        case 1:
            month = 'January'
            break;
        case 2:
            month = 'February'
            break;
        case 3:
            month = 'March'
            break;
        case 4:
            month = 'April'
            break;
        case 5:
            month = 'May'
            break;
        case 6:
            month = 'June'
            break;
        case 7:
            month = 'July'
            break;
        case 8:
            month = 'August'
            break;
        case 9:
            month = 'September'
            break;
        case 10:
            month = 'October'
            break;
        case 11:
            month = 'November'
            break;
        case 12:
            month = 'December'
            break;
    }
    
    // Adds String month to newBudget and creates a 
    // name for the budget based on year and month
    newBudget.month = month
    newBudget.monthNumStr = monthNumStr
    newBudget.name = newBudget.month + ', ' + newBudget.year

    // Declarations for model compliance, sets init
    // values all to 0, to be updated as user inputs
    // categories and entries
    newBudget.incomePlanned = 0
    newBudget.expensesPlanned = 0
    newBudget.incomeTotal = 0
    newBudget.expensesTotal = 0
    
    await Budget.create(newBudget)
    res.redirect('/budgets')
})

app.get('/budgets/:budgetId', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)

    const budgetCategories = foundBudget.categories
    let incomeCategories = []
    let expenseCategories = []

    // Loop through budgetCategories and push accordingly
    // to sort by isIncome
    budgetCategories.forEach( (category) => {
        if(category.isIncome) {
            incomeCategories.push(category)
        } else {
            expenseCategories.push(category)
        }
    })

    res.render('budget/show.ejs', {
        budget: foundBudget,
        incomeCategories: incomeCategories,
        expenseCategories: expenseCategories
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
    
    // Splits the "month" input type into month and year
    let monthInput = updatedBudget.month.split('-')
    let monthNumStr = monthInput.pop()
    let month = parseInt(monthNumStr)
    updatedBudget.year = parseInt(monthInput.pop())
    
    // Changes the month Number to a String
    switch (month) {
        case 1:
            month = 'January'
            break;
        case 2:
            month = 'February'
            break;
        case 3:
            month = 'March'
            break;
        case 4:
            month = 'April'
            break;
        case 5:
            month = 'May'
            break;
        case 6:
            month = 'June'
            break;
        case 7:
            month = 'July'
            break;
        case 8:
            month = 'August'
            break;
        case 9:
            month = 'September'
            break;
        case 10:
            month = 'October'
            break;
        case 11:
            month = 'November'
            break;
        case 12:
            month = 'December'
            break;
    }
    
    // Adds String month to newBudget and creates a 
    // name for the budget based on year and month
    updatedBudget.month = month
    updatedBudget.monthNumStr = monthNumStr
    updatedBudget.name = updatedBudget.month + ', ' + updatedBudget.year
    
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
    
    // Changes String input to Number and inits total
    newCategory.planned = parseFloat(newCategory.planned)
    newCategory.total = 0

    // Pushes new category to category array and saves the category
    // changes
    foundBudget.categories.push(newCategory)
    await foundBudget.save()

    // Updates planned and total values on budget with
    // new planned amounts added by the user
    await updateBudget(foundBudget._id)
    
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

    // Changes String input to Number
    updatedCategory.planned = parseFloat(updatedCategory.planned)

    // Updates budget with new values added by user
    updateChild(foundBudget, foundCategory, updatedCategory)

    // Updates planned and total values on budget with
    // new planned amounts added by the user
    await updateBudget(foundBudget._id)

    res.redirect(`/budgets/${req.params.budgetId}/categories/${req.params.categoryId}`)
})

app.delete('/budgets/:budgetId/categories/:categoryId', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    
    foundBudget.categories.pull(req.params.categoryId)
    await foundBudget.save()

    // Updates planned and total values after category
    // deleted by user
    await updateBudget(foundBudget)
    
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
