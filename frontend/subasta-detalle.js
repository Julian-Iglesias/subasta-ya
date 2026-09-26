const API_URL = 'http://localhost:3000/api'
const PLACEHOLDER_IMAGE = 'https://placehold.co/800x500/e6e8df/68756e?text=SubastaYa'

const auctionId = new URLSearchParams(window.location.search).get('id')
const socket = io('http://localhost:3000')
const loggedUser = getLoggedUser()
const detailContent = document.querySelector('#detail-content')
const detailError = document.querySelector('#detail-error')
const auctionCategory = document.querySelector('#auction-category')
const auctionTitle = document.querySelector('#auction-title')
const auctionSummary = document.querySelector('#auction-summary')
const auctionImage = document.querySelector('#auction-image')
const auctionDescription = document.querySelector('#auction-description')
const bidHistory = document.querySelector('#bid-history')
const currentBid = document.querySelector('#current-bid')
const minimumIncrement = document.querySelector('#minimum-increment')
const suggestedBid = document.querySelector('#suggested-bid')
const remainingHours = document.querySelector('#remaining-hours')
const remainingMinutes = document.querySelector('#remaining-minutes')
const remainingSeconds = document.querySelector('#remaining-seconds')
const countdown = document.querySelector('#countdown')
const bidStatus = document.querySelector('#bid-status')
const bidForm = document.querySelector('#bid-form')
const bidAmount = document.querySelector('#bid-amount')
const submitBidButton = document.querySelector('#submit-bid')
const bidFeedback = document.querySelector('#bid-feedback')
const sellerName = document.querySelector('#seller-name')
const winnerName = document.querySelector('#winner-name')

let currentAuction
let countdownTimer

socket.on('connect', () => {
    if (auctionId) socket.emit('join-auction', auctionId)
})

socket.on('auction-updated', (data) => {
    currentAuction = data.auction || data.data || data
    renderAuction(currentAuction)
    hideDetailError()

    if (data.wasExtended) {
        bidFeedback.textContent = 'La subasta se extendió 2 minutos por una puja en el último minuto.'
        bidFeedback.className = 'feedback success'
    }
})

socket.on('auction-closed', (data) => {
    currentAuction = { ...currentAuction, status: data.status }
    renderAuction(currentAuction)
    bidAmount.disabled = true
    submitBidButton.disabled = true
})

if (!loggedUser || !loggedUser.id) {
    window.location.replace('index.html')
} else if (!auctionId) {
    showDetailError('No se indicó qué subasta querés consultar.')
} else {
    initializeAuctionDetail()
}

function getLoggedUser() {
    try {
        return JSON.parse(localStorage.getItem('subastaya_user'))
    } catch (error) {
        return null
    }
}

function normalizeStatus(status) {
    const normalizedStatus = String(status).toUpperCase()
    const statusLabels = {
        ACTIVE: 'Activa',
        UPCOMING: 'Próxima',
        FINISHED: 'Finalizada',
        FINALIZED: 'Finalizada',
        DESIERTA: 'Desierta',
        LEADING: 'Liderando',
        WON: 'Ganada',
        OUTBID: 'Superado'
    }
    return statusLabels[normalizedStatus] || status
}

async function initializeAuctionDetail() {
    bidForm.addEventListener('submit', submitBid)
    await loadAuction()

    if (currentAuction) {
        countdownTimer = window.setInterval(updateCountdown, 1000)
    }
}

async function loadAuction() {
    try {
        const response = await fetch(`${API_URL}/auctions/${encodeURIComponent(auctionId)}`)
        const result = await parseApiResponse(response, 'No se pudo cargar la subasta.')
        currentAuction = result.auction || result.data || result
        renderAuction(currentAuction)
        hideDetailError()
    } catch (error) {
        stopCountdown()
        showDetailError(getApiErrorMessage(error))
    }
}

function renderAuction(auction) {
    const category = auction.category?.name || auction.categoryName || 'Sin categoría'
    const status = normalizeStatus(auction.status)
    const imageUrl = auction.imageUrl || auction.image_url || PLACEHOLDER_IMAGE
    const actualCurrentBid = auction.currentBid ?? auction.current_bid
    const basePrice = auction.basePrice ?? auction.base_price
    const increment = auction.minimumIncrement ?? auction.minimum_increment
    const nextBid = Number(actualCurrentBid ?? basePrice) + Number(increment || 0)

    auctionCategory.textContent = `${category} · ${status}`
    auctionTitle.textContent = auction.title || 'Subasta sin título'
    auctionSummary.textContent = auction.description || 'Sin descripción disponible.'
    auctionDescription.textContent = auction.description || 'Sin descripción disponible.'
    currentBid.textContent = formatCurrency(actualCurrentBid ?? basePrice)
    minimumIncrement.textContent = formatCurrency(increment)
    suggestedBid.textContent = formatCurrency(nextBid)
    bidAmount.placeholder = formatCurrency(nextBid)
    bidAmount.min = nextBid
    sellerName.textContent = getDisplayName(auction.seller, auction.sellerName, 'Vendedor no disponible')
    winnerName.textContent = `Ganador actual: ${getDisplayName(auction.currentWinner, auction.currentWinnerName, 'Nadie')}`

    renderAuctionImage(imageUrl, auction.title)
    renderBidHistory(auction.bids || auction.bidHistory || auction.history || [])
    renderBidStatus(auction)
    updateCountdown()
}

function renderAuctionImage(imageUrl, title) {
    auctionImage.innerHTML = ''
    const image = document.createElement('img')
    image.src = imageUrl
    image.alt = title || 'Producto en subasta'
    image.addEventListener('error', () => { image.src = PLACEHOLDER_IMAGE })
    auctionImage.append(image)
}

function renderBidHistory(bids) {
    bidHistory.innerHTML = ''

    if (bids.length === 0) {
        bidHistory.innerHTML = '<li><span><strong>Todavía no hay ofertas</strong><small>La primera puja puede ser tuya.</small></span></li>'
        return
    }

    const orderedBids = [...bids].sort((firstBid, secondBid) => {
        return getDateValue(secondBid.createdAt || secondBid.created_at || secondBid.date) - getDateValue(firstBid.createdAt || firstBid.created_at || firstBid.date)
    })

    orderedBids.forEach((bid) => {
        const item = document.createElement('li')
        const details = document.createElement('span')
        const bidder = document.createElement('strong')
        const date = document.createElement('small')
        const amount = document.createElement('span')

        bidder.textContent = getDisplayName(bid.bidder, bid.user, 'Usuario anónimo')
        date.textContent = formatDate(bid.createdAt || bid.created_at || bid.date)
        amount.className = 'bid-amount'
        amount.textContent = formatCurrency(bid.amount)
        details.append(bidder, date)
        item.append(details, amount)
        bidHistory.append(item)
    })
}

function renderBidStatus(auction) {
    const winnerId = getEntityId(auction.currentWinner) || auction.currentWinnerId || auction.current_winner_id
    const bids = auction.bids || auction.bidHistory || auction.history || []
    const userHasBid = bids.some((bid) => {
        const bidderId = getEntityId(bid.bidder) || bid.bidderId || bid.bidder_id || bid.userId || bid.user_id
        return String(bidderId) === String(loggedUser.id)
    })

    bidStatus.className = 'bid-status'
    if (String(winnerId) === String(loggedUser.id)) {
        bidStatus.textContent = 'Liderando'
        bidStatus.classList.add('leading')
    } else if (userHasBid) {
        bidStatus.textContent = 'Superado'
        bidStatus.classList.add('outbid')
    } else {
        bidStatus.textContent = ''
    }
}

function updateCountdown() {
    if (!currentAuction) return

    const endDate = currentAuction.endDate || currentAuction.end_date
    const remaining = getDateValue(endDate) - Date.now()
    const totalSeconds = Math.max(0, Math.floor(remaining / 1000))
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    remainingHours.textContent = String(hours).padStart(2, '0')
    remainingMinutes.textContent = String(minutes).padStart(2, '0')
    remainingSeconds.textContent = String(seconds).padStart(2, '0')
    countdown.classList.toggle('critical', remaining > 0 && remaining <= 60 * 1000)
    countdown.classList.toggle('expired', remaining <= 0)

    if (remaining <= 0) {
        bidAmount.disabled = true
        submitBidButton.disabled = true
    }
}

async function submitBid(event) {
    event.preventDefault()
    const amount = Number(bidAmount.value)
    const nextBid = getSuggestedBid()

    bidFeedback.textContent = ''
    bidFeedback.className = 'feedback'

    if (!Number.isFinite(amount) || amount <= nextBid) {
        bidFeedback.textContent = `La oferta debe ser mayor a ${formatCurrency(nextBid)}.`
        bidFeedback.className = 'feedback error'
        return
    }

    submitBidButton.disabled = true
    submitBidButton.innerHTML = '<span class="button-spinner" aria-hidden="true"></span> Enviando...'

    try {
        const response = await fetch(`${API_URL}/auctions/${encodeURIComponent(auctionId)}/bids`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: loggedUser.id, amount })
        })
        const result = await response.json().catch(() => ({}))

        if (!response.ok) {
            throw createBidError(response.status, result.message)
        }

        bidAmount.value = ''
        bidFeedback.textContent = 'Puja aceptada correctamente.'
        bidFeedback.className = 'feedback success'
        await loadAuction()
    } catch (error) {
        bidFeedback.textContent = error.message
        bidFeedback.className = 'feedback error'
    } finally {
        submitBidButton.disabled = currentAuction?.status !== 'ACTIVE'
        submitBidButton.innerHTML = 'Pujar'
    }
}

function getSuggestedBid() {
    if (!currentAuction) return 0
    const actualCurrentBid = currentAuction.currentBid ?? currentAuction.current_bid
    const basePrice = currentAuction.basePrice ?? currentAuction.base_price
    const increment = currentAuction.minimumIncrement ?? currentAuction.minimum_increment
    return Number(actualCurrentBid ?? basePrice) + Number(increment || 0)
}

function createBidError(status, message) {
    if (status === 409) return new Error(message || 'Alguien ofertó justo antes que vos, probá con un monto mayor')
    if (status === 422) return new Error('Saldo insuficiente para esta oferta')
    if (status === 400) return new Error(message || 'La oferta no es válida. Revisá el monto y el estado de la subasta.')
    return new Error(message || 'No se pudo registrar la puja. Intentá nuevamente.')
}

function showDetailError(message) {
    detailContent.hidden = true
    detailError.hidden = false
    detailError.textContent = message
}

function hideDetailError() {
    detailContent.hidden = false
    detailError.hidden = true
}

function stopCountdown() {
    if (countdownTimer) window.clearInterval(countdownTimer)
    countdownTimer = undefined
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

function getApiErrorMessage(error) {
    if (error.status === 404) return 'La subasta no existe o el backend todavía no tiene disponible esta ruta.'
    return error.message || 'No se pudo cargar la subasta. Verificá que el backend esté encendido.'
}

function getEntityId(entity) {
    return entity?.id ?? entity?.userId ?? entity?.user_id
}

function getDisplayName(entity, fallbackName, defaultName) {
    return entity?.name || entity?.username || entity?.email || fallbackName || defaultName
}

function getDateValue(value) {
    const dateValue = new Date(value).getTime()
    return Number.isNaN(dateValue) ? 0 : dateValue
}

function formatDate(value) {
    if (!value) return 'Sin fecha'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('es-AR')
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
