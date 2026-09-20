const API_URL = 'http://localhost:3000/api'

const totalBalance = document.querySelector('#total-balance')
const heldBalance = document.querySelector('#held-balance')
const availableBalance = document.querySelector('#available-balance')
const movementsBody = document.querySelector('#movements-body')
const walletMessage = document.querySelector('#wallet-message')
const openDepositModalButton = document.querySelector('#open-deposit-modal')
const depositModal = document.querySelector('#deposit-modal')
const closeDepositModalButton = document.querySelector('#close-deposit-modal')
const cancelDepositModalButton = document.querySelector('#cancel-deposit-modal')
const depositForm = document.querySelector('#deposit-form')
const depositAmount = document.querySelector('#deposit-amount')
const depositError = document.querySelector('#deposit-error')
const submitDepositButton = document.querySelector('#submit-deposit')
const depositFeedback = document.querySelector('#deposit-feedback')

const loggedUser = getLoggedUser()

if (!loggedUser || !loggedUser.id) {
    window.location.replace('index.html')
} else {
    initializeWallet()
}

function getLoggedUser() {
    try {
        return JSON.parse(localStorage.getItem('subastaya_user'))
    } catch (error) {
        return null
    }
}

async function initializeWallet() {
    setWalletLoadingState()
    bindWalletEvents()
    await Promise.all([loadBalance(), loadMovements()])
}

function bindWalletEvents() {
    openDepositModalButton.addEventListener('click', openDepositModal)
    closeDepositModalButton.addEventListener('click', closeDepositModal)
    cancelDepositModalButton.addEventListener('click', closeDepositModal)
    depositAmount.addEventListener('input', validateDepositAmount)
    depositForm.addEventListener('submit', submitDeposit)
}

async function loadBalance() {
    try {
        const response = await fetch(`${API_URL}/wallets/${encodeURIComponent(loggedUser.id)}`)
        const result = await parseApiResponse(response, 'No se pudo cargar el saldo.')
        const balance = result.balance || result.data || result

        totalBalance.textContent = formatCurrency(balance.totalBalance ?? balance.total_balance)
        heldBalance.textContent = formatCurrency(balance.heldBalance ?? balance.held_balance)
        availableBalance.textContent = formatCurrency(balance.availableBalance ?? balance.available_balance)
    } catch (error) {
        totalBalance.textContent = 'No disponible'
        heldBalance.textContent = 'No disponible'
        availableBalance.textContent = 'No disponible'
        showWalletMessage(getApiErrorMessage(error, 'No se pudo cargar el saldo.'), true)
    }
}

async function loadMovements() {
    try {
        const response = await fetch(`${API_URL}/wallets/${encodeURIComponent(loggedUser.id)}/transactions`)
        const result = await parseApiResponse(response, 'No se pudieron cargar los movimientos.')
        const movements = Array.isArray(result) ? result : result.movements || result.data || []
        renderMovements(movements)
    } catch (error) {
        movementsBody.innerHTML = '<tr><td colspan="4">No se pudieron cargar los movimientos.</td></tr>'
        showWalletMessage(getApiErrorMessage(error, 'No se pudieron cargar los movimientos.'), true)
    }
}

function renderMovements(movements) {
    movementsBody.innerHTML = ''

    if (movements.length === 0) {
        movementsBody.innerHTML = '<tr><td colspan="4">Todavía no tenés movimientos.</td></tr>'
        return
    }

    movements.forEach((movement) => {
        const row = document.createElement('tr')
        const amount = Number(movement.amount) || 0
        const amountClass = amount >= 0 ? 'positive' : 'negative'
        const formattedAmount = `${amount >= 0 ? '+' : ''}${formatCurrency(amount)}`

        row.innerHTML = `
            <td>${escapeHtml(formatDate(movement.createdAt || movement.created_at || movement.date))}</td>
            <td>${escapeHtml(movement.concept || movement.tpye || 'Movimiento')}</td>
            <td>${escapeHtml(movement.status || 'Completado')}</td>
            <td class="${amountClass}">${formattedAmount}</td>
        `
        movementsBody.append(row)
    })
}

function openDepositModal() {
    depositModal.hidden = false
    depositAmount.focus()
    resetDepositState()
}

function closeDepositModal() {
    depositModal.hidden = true
    resetDepositState()
}

function resetDepositState() {
    depositError.textContent = ''
    depositFeedback.textContent = ''
    depositFeedback.className = 'feedback'
    depositAmount.classList.remove('has-error')
    submitDepositButton.disabled = true
}

function validateDepositAmount() {
    const amount = Number(depositAmount.value)
    const isValid = Number.isFinite(amount) && amount > 0

    submitDepositButton.disabled = !isValid
    depositAmount.classList.toggle('has-error', depositAmount.value !== '' && !isValid)
    depositError.textContent = depositAmount.value !== '' && !isValid
        ? 'Ingresá un monto positivo.'
        : ''

    return isValid
}

async function submitDeposit(event) {
    event.preventDefault()
    if (!validateDepositAmount()) return

    submitDepositButton.disabled = true
    submitDepositButton.innerHTML = '<span class="button-spinner" aria-hidden="true"></span> Cargando...'
    depositFeedback.textContent = 'Procesando depósito...'
    depositFeedback.className = 'feedback'

    try {
        const response = await fetch(`${API_URL}/wallets/${encodeURIComponent(loggedUser.id)}/deposits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Number(depositAmount.value) })
        })
        const result = await parseApiResponse(response, 'No se pudo cargar el saldo.')

        closeDepositModal()
        showWalletMessage(result.message || 'Saldo cargado correctamente.')
        await Promise.all([loadBalance(), loadMovements()])
    } catch (error) {
        depositFeedback.textContent = getApiErrorMessage(error, 'No se pudo cargar el saldo.')
        depositFeedback.className = 'feedback error'
    } finally {
        submitDepositButton.disabled = !validateDepositAmount()
        submitDepositButton.innerHTML = 'Cargar saldo'
    }
}

function setWalletLoadingState() {
    totalBalance.textContent = 'Cargando...'
    heldBalance.textContent = 'Cargando...'
    availableBalance.textContent = 'Cargando...'
    movementsBody.innerHTML = '<tr><td colspan="4">Cargando movimientos...</td></tr>'
}

function showWalletMessage(message, isError = false) {
    walletMessage.textContent = message
    walletMessage.className = isError ? 'feedback error' : 'feedback success'
}

async function parseApiResponse(response, fallbackMessage) {
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
        const error = new Error(result.message || fallbackMessage)
        error.status = response.status
        throw error
    }
    return result
}

function getApiErrorMessage(error, fallbackMessage) {
    if (error.status === 404) return 'Esta función todavía no está disponible en el backend.'
    return error.message || fallbackMessage
}

function formatCurrency(value) {
    const amount = Number(value)
    if (!Number.isFinite(amount)) return 'No disponible'

    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 2
    }).format(amount)
}

function formatDate(value) {
    if (!value) return 'Sin fecha'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('es-AR')
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    })[character])
}
