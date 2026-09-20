const API_URL = 'http://localhost:3000/api'
const PLACEHOLDER_IMAGE = 'https://placehold.co/800x500/e6e8df/68756e?text=SubastaYa'
const DEFAULT_CATEGORIES = [
    { id: 1, name: 'Tecnología' },
    { id: 2, name: 'Coleccionables' },
    { id: 3, name: 'Indumentaria' },
    { id: 4, name: 'Vehículos' }
]

const auctionGrid = document.querySelector('#auction-grid')
const catalogMessage = document.querySelector('#catalog-message')
const categoryFilters = document.querySelector('#category-filters')
const statusFilters = document.querySelector('#status-filters')
const sortSelect = document.querySelector('#sort-select')
const openAuctionModalButton = document.querySelector('#open-auction-modal')
const auctionModal = document.querySelector('#auction-modal')
const closeAuctionModalButton = document.querySelector('#close-auction-modal')
const cancelAuctionModalButton = document.querySelector('#cancel-auction-modal')
const auctionForm = document.querySelector('#auction-form')
const auctionCategorySelect = document.querySelector('#auction-category')
const submitAuctionButton = document.querySelector('#submit-auction')
const auctionFeedback = document.querySelector('#auction-feedback')
const loggedUser = getLoggedUser()

const filters = {
    status: '',
    categoryId: '',
    sort: sortSelect.value
}

let countdownTimer

if (!localStorage.getItem('subastaya_user')) {
    window.location.replace('index.html')
} else {
    initializeCatalog()
}

async function initializeCatalog() {
    bindFilterEvents()
    await loadCategories()
    await loadAuctions()
}

function bindFilterEvents() {
    statusFilters.addEventListener('click', (event) => {
        const chip = event.target.closest('[data-status]')
        if (!chip) return

        filters.status = chip.dataset.status
        setActiveChip(statusFilters, chip)
        loadAuctions()
    })

    sortSelect.addEventListener('change', () => {
        filters.sort = sortSelect.value
        loadAuctions()
    })

    openAuctionModalButton.addEventListener('click', openAuctionModal)
    closeAuctionModalButton.addEventListener('click', closeAuctionModal)
    cancelAuctionModalButton.addEventListener('click', closeAuctionModal)
    auctionForm.addEventListener('submit', submitAuction)
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`)
        if (!response.ok) throw new Error('No se pudieron cargar las categorías.')

        const payload = await response.json()
        const categories = Array.isArray(payload) ? payload : payload.categories || []
        const availableCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES
        renderCategoryFilters(availableCategories)
        renderAuctionCategoryOptions(availableCategories)
    } catch (error) {
        renderCategoryFilters(DEFAULT_CATEGORIES)
        renderAuctionCategoryOptions(DEFAULT_CATEGORIES)
    }
}

function renderCategoryFilters(categories) {
    categoryFilters.innerHTML = ''
    const allChip = createFilterChip('Todas', '')
    allChip.classList.add('active')
    categoryFilters.append(allChip)

    categories.forEach((category) => {
        categoryFilters.append(createFilterChip(category.name, category.id))
    })
}

function createFilterChip(label, categoryId) {
    const chip = document.createElement('button')
    chip.className = 'filter-chip'
    chip.type = 'button'
    chip.dataset.categoryId = categoryId
    chip.textContent = label
    chip.addEventListener('click', () => {
        filters.categoryId = categoryId
        setActiveChip(categoryFilters, chip)
        loadAuctions()
    })
    return chip
}

async function loadAuctions() {
    stopCountdown()
    showMessage('Cargando subastas...')
    auctionGrid.innerHTML = ''

    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.categoryId) params.set('category_id', filters.categoryId)
    if (filters.sort) params.set('sort', filters.sort)

    try {
        const response = await fetch(`${API_URL}/auctions?${params.toString()}`)
        if (!response.ok) throw new Error('No se pudo conectar con el catálogo.')

        const payload = await response.json()
        const auctions = Array.isArray(payload) ? payload : payload.auctions || []
        renderAuctions(auctions)
    } catch (error) {
        showMessage('No pudimos cargar las subastas. Verificá que el backend esté encendido e intentá nuevamente.', true)
    }
}

function renderAuctions(auctions) {
    auctionGrid.innerHTML = ''

    if (auctions.length === 0) {
        showMessage('No hay subastas que coincidan con los filtros seleccionados.')
        return
    }

    catalogMessage.hidden = true
    auctions.forEach((auction) => auctionGrid.append(createAuctionCard(auction)))
    updateCountdowns()
    countdownTimer = window.setInterval(updateCountdowns, 1000)
}

function createAuctionCard(auction) {
    const card = document.createElement('article')
    card.className = 'auction-card'

    const imageWrapper = document.createElement('div')
    imageWrapper.className = 'auction-card-image'
    const image = document.createElement('img')
    image.src = auction.imageUrl || PLACEHOLDER_IMAGE
    image.alt = auction.title || 'Producto en subasta'
    image.addEventListener('error', () => { image.src = PLACEHOLDER_IMAGE })
    imageWrapper.append(image)

    const content = document.createElement('div')
    content.className = 'auction-card-content'

    const category = document.createElement('p')
    category.className = 'auction-category'
    category.textContent = auction.category?.name || 'Sin categoría'

    const title = document.createElement('h2')
    title.textContent = auction.title || 'Subasta sin título'

    const price = document.createElement('strong')
    price.className = 'auction-card-price'
    price.textContent = formatCurrency(auction.currentBid ?? auction.basePrice)

    const meta = document.createElement('div')
    meta.className = 'auction-card-meta'
    meta.innerHTML = `<span>${auction.bidCount ?? 0} ofertas</span>`
    const countdown = document.createElement('span')
    countdown.className = 'time-remaining'
    countdown.dataset.endDate = auction.endDate
    meta.append(countdown)

    const link = document.createElement('a')
    link.className = 'button'
    link.href = `subasta-detalle.html?id=${encodeURIComponent(auction.id)}`
    link.textContent = 'Ver subasta'

    content.append(category, title, price, meta, link)
    card.append(imageWrapper, content)
    return card
}

function updateCountdowns() {
    document.querySelectorAll('.time-remaining').forEach((counter) => {
        const remaining = new Date(counter.dataset.endDate).getTime() - Date.now()
        counter.textContent = formatRemainingTime(remaining)
        counter.classList.toggle('critical', remaining > 0 && remaining < 60 * 1000)
    })
}

function formatRemainingTime(milliseconds) {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return 'Finalizada'
    const totalSeconds = Math.floor(milliseconds / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    if (days > 0) return `${days}d ${hours}h`
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(Number(value) || 0)
}

function setActiveChip(container, activeChip) {
    container.querySelectorAll('.filter-chip').forEach((chip) => chip.classList.toggle('active', chip === activeChip))
}

function showMessage(message, isError = false) {
    catalogMessage.hidden = false
    catalogMessage.textContent = message
    catalogMessage.classList.toggle('error', isError)
}

function stopCountdown() {
    if (countdownTimer) {
        window.clearInterval(countdownTimer)
        countdownTimer = undefined
    }
}

function renderAuctionCategoryOptions(categories) {
    auctionCategorySelect.innerHTML = '<option value="">Seleccioná una categoría</option>'
    categories.forEach((category) => {
        const option = document.createElement('option')
        option.value = category.id
        option.textContent = category.name
        auctionCategorySelect.append(option)
    })
}

function openAuctionModal() {
    auctionModal.hidden = false
    clearAuctionFormState()
    document.querySelector('#auction-title').focus()
}

function closeAuctionModal() {
    auctionModal.hidden = true
    clearAuctionFormState()
}

function clearAuctionFormState() {
    auctionFeedback.textContent = ''
    auctionFeedback.className = 'feedback'
    document.querySelectorAll('.field-error').forEach((fieldError) => {
        fieldError.textContent = ''
    })
    document.querySelectorAll('#auction-form input, #auction-form textarea, #auction-form select').forEach((field) => {
        field.classList.remove('has-error')
    })
}

function validateAuctionForm(data) {
    const errors = {}
    const basePrice = Number(data.basePrice)
    const minimumIncrement = Number(data.minimumIncrement)
    const imageUrl = data.imageUrl.trim()

    if (!data.title.trim()) errors.title = 'Ingresá un título.'
    if (!data.description.trim()) errors.description = 'Ingresá una descripción.'
    if (imageUrl && !isValidUrl(imageUrl)) errors.imageUrl = 'Ingresá una URL válida, por ejemplo: https://sitio.com/imagen.jpg.'
    if (!data.categoryId) errors.categoryId = 'Seleccioná una categoría.'
    if (!Number.isFinite(basePrice) || basePrice <= 0) errors.basePrice = 'Debe ser un número positivo.'
    if (!Number.isFinite(minimumIncrement) || minimumIncrement <= 0) errors.minimumIncrement = 'Debe ser un número positivo.'
    if (!data.startDate) errors.startDate = 'Ingresá la fecha de inicio.'
    if (!data.endDate) errors.endDate = 'Ingresá la fecha de fin.'

    if (data.startDate && Number.isNaN(new Date(data.startDate).getTime())) {
        errors.startDate = 'Ingresá una fecha de inicio válida.'
    }

    if (data.endDate && Number.isNaN(new Date(data.endDate).getTime())) {
        errors.endDate = 'Ingresá una fecha de fin válida.'
    }

    if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
        errors.endDate = 'Debe ser posterior a la fecha de inicio.'
    }

    return errors
}

function isValidUrl(value) {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch (error) {
        return false
    }
}

function showAuctionValidationErrors(errors) {
    Object.entries(errors).forEach(([fieldName, message]) => {
        const fieldError = document.querySelector(`[data-error-for="${fieldName}"]`)
        const field = document.querySelector(`[name="${fieldName}"]`)
        if (fieldError) fieldError.textContent = message
        if (field) field.classList.add('has-error')
    })
}

async function submitAuction(event) {
    event.preventDefault()
    clearAuctionFormState()

    const data = Object.fromEntries(new FormData(auctionForm).entries())
    const errors = validateAuctionForm(data)
    if (Object.keys(errors).length > 0) {
        showAuctionValidationErrors(errors)
        return
    }

    submitAuctionButton.disabled = true
    submitAuctionButton.innerHTML = '<span class="button-spinner" aria-hidden="true"></span> Publicando...'
    auctionFeedback.textContent = 'Publicando subasta...'
    auctionFeedback.className = 'feedback'

    const payload = {
        sellerId: loggedUser?.id,
        title: data.title.trim(),
        description: data.description.trim(),
        imageUrl: data.imageUrl.trim() || null,
        categoryId: Number(data.categoryId),
        basePrice: Number(data.basePrice),
        minimumIncrement: Number(data.minimumIncrement),
        startDate: data.startDate,
        endDate: data.endDate
    }

    try {
        const response = await fetch(`${API_URL}/auctions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        const result = await response.json().catch(() => ({}))
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('El backend todavía no tiene habilitada la creación de subastas (POST /api/auctions).')
            }

            if (result.errors && typeof result.errors === 'object') {
                showAuctionValidationErrors(result.errors)
                throw new Error('Revisá los campos marcados en el formulario.')
            }

            throw new Error(result.message || `La API rechazó la publicación (HTTP ${response.status}).`)
        }

        closeAuctionModal()
        await loadAuctions()
        showMessage('Subasta creada correctamente.')
    } catch (error) {
        auctionFeedback.textContent = error.message || 'No se pudo conectar con el backend.'
        auctionFeedback.className = 'feedback error'
    } finally {
        submitAuctionButton.disabled = false
        submitAuctionButton.innerHTML = 'Publicar subasta'
    }
}

function getLoggedUser() {
    try {
        return JSON.parse(localStorage.getItem('subastaya_user'))
    } catch (error) {
        return null
    }
}