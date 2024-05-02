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
    const foundCategory = await Category.findById(categoryId)
    
    // Pushes new entry to entry array and saves the category
    // changes
    foundCategory.entries.push(newEntry)
    await foundCategory.save()
    
    // Returns the found category for reference by caller
    return foundCategory
}

// Loops through passed obj to find the array of embedded
// documents. It then compares the ids of the embedded docs
// to the given id and returns the found match
const findEmbeddedDoc = (parent, embeddedId) => {
    let foundEmbeddedDoc = {}
    let embeddedArr = []
    const parentValues = Object.values(parent)

    // Uses nested loops to find the array of objects inside
    // the parentValues. The initial values of parentValues
    // returns multiple values other than the data obj, so
    // a nested childValues obj had to be created to find
    // the data obj so THAT could be iterated over to find
    // the embedded array
    parentValues.forEach( (parentValue) => {
        if (typeof(parentValue) === 'object') {
            const childValues = Object.values(parentValue)
            
            childValues.forEach( (value) => {
                if(Array.isArray(value)) {
                    embeddedArr = value
                }
            })
        }
    })
    
    // Loops through the array of embedded docs and
    // stores the matched id object for return
    embeddedArr.forEach( (embeddedDoc) => {
        if (embeddedDoc.id === embeddedId) {
            foundEmbeddedDoc = embeddedDoc
        }
    })

    // If matching id not found, name is undefined
    // If not found, returns false, else returns found obj
    if (foundEmbeddedDoc.name === undefined) {
        return false
    } else {
        return foundEmbeddedDoc
    }
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
    const newEntry = req.body
    
    // Change input strings to Nums
    newEntry.postedDay = parseInt(newEntry.postedDay)
    newEntry.amount = parseInt(newEntry.amount)
    
    // Calls function to create new entry then redirects
    // to show page for category
    await createEntry(req.params.categoryId, newEntry)
    res.redirect(`/categories/${req.params.categoryId}`)
})

app.get('/categories/:categoryId/entries/:entryId', async (req, res) => {
    const foundCategory = await Category.findById(req.params.categoryId)
    
    // Calls function to find entry in category entry array, returns false
    // if not found
    const foundEntry = findEmbeddedDoc(foundCategory, req.params.entryId)

    // If matching id not found, redirects to category show page,
    // else, renders entry show page
    if (foundEntry === false) {
        res.redirect(`/categories/${req.params.categoryId}`)
    } else {
        res.render('entry/show.ejs', {
            category: foundCategory,
            entry: foundEntry
        })
    }
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


// ================ SERVER ================== //
mongoose.connection.on('connected', () => {
    console.log('Connected to database...')
})

app.listen(3000, () => {
    console.log('listening on port 3000...')
})
