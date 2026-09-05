const API_URL = 'http://localhost:3000/api'

const form = document.querySelector('#auth-form')
const tabs = document.querySelectorAll('.tab')
const nameField = document.querySelector('.register-only')
const nameInput = document.querySelector('#name')
const formTitle = document.querySelector('#form-title')
const formDescription = document.querySelector('#form-description')
const submitButton = document.querySelector('#submit-button')
const feedback = document.querySelector('#feedback')
const sessionCard = document.querySelector('#session-card')
const sessionName = document.querySelector('#session-name')
const sessionEmail = document.querySelector('#session-email')
const logoutButton = document.querySelector('#logout-button')

let currentView = 'login'

function showFeedback(message, type = '') {
    feedback.textContent = message
    feedback.className = `feedback ${type}`
}

function setView(view) {
    currentView = view
    const isRegistering = view === 'register'

    tabs.forEach((tab) => {
        const isActive = tab.dataset.view === view
        tab.classList.toggle('is-active', isActive)
        tab.setAttribute('aria-selected', String(isActive))
    })

    nameField.hidden = !isRegistering
    nameInput.required = isRegistering
    formTitle.textContent = isRegistering ? 'Crear cuenta' : 'Iniciar sesión'
    formDescription.textContent = isRegistering
        ? 'Registrate para empezar a participar.'
        : 'Ingresá tus datos para continuar.'
    submitButton.textContent = isRegistering ? 'Crear cuenta' : 'Ingresar'
    showFeedback('')
}

tabs.forEach((tab) => {
    tab.addEventListener('click', () => setView(tab.dataset.view))
})

form.addEventListener('submit', async (event) => {
    event.preventDefault()
    showFeedback('Procesando...')
    submitButton.disabled = true

    const data = Object.fromEntries(new FormData(form).entries())
    const endpoint = currentView === 'register' ? '/users' : '/auth/login'
    const payload = currentView === 'register'
        ? data
        : { email: data.email, password: data.password }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.message || 'Ocurrió un error')
        }

        if (currentView === 'register') {
            showFeedback('Cuenta creada. Ya podés iniciar sesión.', 'success')
            form.reset()
            setView('login')
            showFeedback('Cuenta creada. Ahora iniciá sesión.', 'success')
        } else {
            sessionName.textContent = result.user.name
            sessionEmail.textContent = result.user.email
            sessionCard.hidden = false
            showFeedback('Login correcto.', 'success')
            form.reset()
        }
    } catch (error) {
        showFeedback(error.message || 'No se pudo conectar con el backend.', 'error')
    } finally {
        submitButton.disabled = false
    }
})

logoutButton.addEventListener('click', () => {
    sessionCard.hidden = true
    showFeedback('Sesión cerrada.', 'success')
})