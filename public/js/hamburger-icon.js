const hamburgerButtonEl = document.querySelector('#hamburger-button')
const hamburgerIconEl = document.querySelector('#hamburger-icon')
const lineEls = document.querySelectorAll('.line')

// Listener changes hamburger icon orientation to vertical
// when clicked using css styling
hamburgerButtonEl.addEventListener('click', () => {
    if (hamburgerButtonEl.checked) {
        lineEls.forEach( (el) => {
            el.style.width = '5px'
            el.style.height = '30px'
            el.style.display = 'inline-block'
            el.style.margin = '1px'
        })
        hamburgerIconEl.style.right = '15px'
    } else {
        lineEls.forEach( (el) => {
            el.style.width = '30px'
            el.style.height = '5px'
            el.style.display = 'block'
            el.style.margin = '5px'
        })
        hamburgerIconEl.style.right = '10px'
    }
})
