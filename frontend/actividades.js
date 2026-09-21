const API_URL = 'http://localhost:3000/api'

const activityTabs = document.querySelectorAll('[data-activity-tab]')
const bidsPanel = document.querySelector('#bids-panel')
const publicationsPanel = document.querySelector('#publications-panel')
const loggedUser = getLoggedUser()

initializeActivities()

async function initializeActivities() {
    bindActivityTabs()
    await Promise.all([loadBids(), loadPublications()])
}

function bindActivityTabs() {
    bidsPanel.hidden = false
    publicationsPanel.hidden = true

    activityTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const selectedTab = tab.dataset.activityTab
            activityTabs.forEach((item) => item.classList.toggle('active', item === tab))
            bidsPanel.hidden = selectedTab !== 'bids'
            publicationsPanel.hidden = selectedTab !== 'publications'
        })
    })
}

async function loadBids() {
    try {
        const response = await fetch(`${API_URL}/users/${encodeURIComponent(loggedUser.id)}/bids`)
        const result = await parseApiResponse(response, 'No se pudieron cargar tus pujas.')
        const bids = Array.isArray(result) ? result : result.bids || result.data || []
        renderBids(bids)
    } catch (error) {
        showActivityError(bidsPanel, getApiErrorMessage(error, 'No se pudieron cargar tus pujas.'))
    }
}

async function loadPublications() {
    try {
        const userPath = `${API_URL}/users/${encodeURIComponent(loggedUser.id)}`
        const [auctionsResponse, bidsResponse] = await Promise.all([
            fetch(`${userPath}/auctions`),
            fetch(`${userPath}/bids`)
        ])
        const auctionsResult = await parseApiResponse(auctionsResponse, 'No se pudieron cargar tus publicaciones.')
        const bidsResult = await parseApiResponse(bidsResponse, 'No se pudieron cargar tus pujas.')
        const auctions = Array.isArray(auctionsResult) ? auctionsResult : auctionsResult.auctions || auctionsResult.data || []
        const bids = Array.isArray(bidsResult) ? bidsResult : bidsResult.bids || bidsResult.data || []
        renderPublications(auctions, bids)
    } catch (error) {
        showActivityError(publicationsPanel, getApiErrorMessage(error, 'No se pudieron cargar tus publicaciones.'))
    }
}

function renderBids(bids) {
    bidsPanel.innerHTML = ''

    if (bids.length === 0) {
        showEmptyActivity(bidsPanel)
        return
    }

    bids.forEach((bid) => {
        const auction = bid.auction || {}
        const row = createActivityRow(
            auction.title || bid.auctionTitle || 'Subasta sin título',
            bid.amount ?? bid.currentBid,
            bid.status || 'OUTBID'
        )
        bidsPanel.append(row)
    })
}

function renderPublications(auctions, bids = []) {
    publicationsPanel.innerHTML = ''

    const relevantBids = bids.filter((bid) => ['LEADING', 'WON'].includes(bid.status))
    if (auctions.length === 0 && relevantBids.length === 0) {
        showEmptyActivity(publicationsPanel)
        return
    }

    auctions.forEach((auction) => {
        const relevantData = auction.currentBid ?? auction.current_bid ?? auction.bidCount ?? auction.bid_count ?? 0
        const row = createActivityRow(
            auction.title || 'Subasta sin título',
            relevantData,
            auction.status || 'Activa'
        )
        publicationsPanel.append(row)
    })

    relevantBids.forEach((bid) => {
        const row = createActivityRow(
            bid.auction?.title || 'Subasta sin título',
            bid.amount,
            bid.status
        )
        publicationsPanel.append(row)
    })
}

function createActivityRow(title, relevantData, status) {
    const row = document.createElement('div')
    row.className = 'activity-row'

    const details = document.createElement('span')
    const titleElement = document.createElement('strong')
    titleElement.className = 'activity-title'
    titleElement.textContent = title

    const subtitle = document.createElement('small')
    subtitle.textContent = formatRelevantData(relevantData)
    details.append(titleElement, subtitle)

    const statusElement = document.createElement('span')
    statusElement.className = 'status'
    statusElement.textContent = normalizeStatus(status)

    row.append(details, statusElement)
    return row
}

function showEmptyActivity(panel) {
    const message = document.createElement('p')
    message.className = 'activity-message'
    message.textContent = 'Todavía no tenés actividad acá.'
    panel.append(message)
}

function showActivityError(panel, message) {
    panel.innerHTML = ''
    const error = document.createElement('p')
    error.className = 'activity-message error'
    error.textContent = message
    panel.append(error)
}

function formatRelevantData(value) {
    if (typeof value === 'number' || !Number.isNaN(Number(value))) {
        return `Monto relevante: ${formatCurrency(value)}`
    }
    return String(value || 'Sin datos adicionales')
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
    if (error.status === 404) return 'Todavía no disponible.'
    return error.message || fallbackMessage
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 2
    }).format(Number(value) || 0)
}

function getLoggedUser() {
    try {
        return JSON.parse(localStorage.getItem('subastaya_user')) || {}
    } catch (error) {
        return {}
    }
}
