const API_URL = 'http://localhost:3000/api'
const PLACEHOLDER_IMAGE = 'https://placehold.co/800x500/e6e8df/68756e?text=SubastaYa'

const auctionGrid = document.querySelector('#auction-grid')
const catalogMessage = document.querySelector('#catalog-message')
const categoryFilters = document.querySelector('#category-filters')
const statusFilters = document.querySelector('#status-filters')
const sortSelect = document.querySelector('#sort-select')

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
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`)
        if (!response.ok) throw new Error('No se pudieron cargar las categorías.')

        const payload = await response.json()
        const categories = Array.isArray(payload) ? payload : payload.categories || []
        renderCategoryFilters(categories)
    } catch (error) {
        categoryFilters.innerHTML = '<span class="muted-copy">No se pudieron cargar las categorías.</span>'
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