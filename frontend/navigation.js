const navigationTemplate = `
    <header class="site-header">
        <a class="brand" href="catalogo.html">SubastaYa</a>
        <nav class="main-nav" aria-label="Navegación principal">
            <a href="catalogo.html">Subastas</a>
            <button class="nav-link-disabled" id="open-sales-notice" type="button">Vender</button>
            <div class="profile">
                <button class="profile-trigger" type="button" aria-expanded="false" aria-controls="profile-menu">
                    <span class="profile-icon" aria-hidden="true">SY</span>
                    <span class="profile-name"></span>
                    <span class="profile-arrow" aria-hidden="true">⌄</span>
                </button>
                <div class="profile-menu" id="profile-menu" hidden>
                    <a href="mis-actividades.html">Actividad</a>
                    <a href="billetera.html">Mi billetera</a>
                    <a href="index.html" data-logout>Cerrar sesión</a>
                </div>
            </div>
        </nav>
    </header>
    <div class="modal-backdrop" id="sales-notice" hidden>
        <section class="modal notice-modal" role="dialog" aria-modal="true" aria-labelledby="sales-notice-title">
            <div class="modal-header">
                <h2 id="sales-notice-title">Módulo de ventas próximamente</h2>
                <button class="modal-close" id="close-sales-notice" type="button" aria-label="Cerrar">&times;</button>
            </div>
            <p>Estamos preparando esta función.</p>
        </section>
    </div>
`

document.querySelector('[data-app-header]').innerHTML = navigationTemplate

const profileTrigger = document.querySelector('.profile-trigger')
const profileMenu = document.querySelector('.profile-menu')
const profileName = document.querySelector('.profile-name')
const openSalesNotice = document.querySelector('#open-sales-notice')
const salesNotice = document.querySelector('#sales-notice')
const closeSalesNotice = document.querySelector('#close-sales-notice')
const navigationUser = getLoggedUser()

profileName.textContent = navigationUser?.name || navigationUser?.email || 'Perfil'

openSalesNotice.addEventListener('click', () => {
    salesNotice.hidden = false
    closeSalesNotice.focus()
})

closeSalesNotice.addEventListener('click', () => {
    salesNotice.hidden = true
    openSalesNotice.focus()
})

salesNotice.addEventListener('click', (event) => {
    if (event.target === salesNotice) salesNotice.hidden = true
})

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !salesNotice.hidden) {
        salesNotice.hidden = true
        openSalesNotice.focus()
    }
})

profileTrigger.addEventListener('click', () => {
    const isOpen = profileTrigger.getAttribute('aria-expanded') === 'true'
    profileTrigger.setAttribute('aria-expanded', String(!isOpen))
    profileMenu.hidden = isOpen
})

document.addEventListener('click', (event) => {
    if (!event.target.closest('.profile')) {
        profileTrigger.setAttribute('aria-expanded', 'false')
        profileMenu.hidden = true
    }
})

document.querySelector('[data-logout]').addEventListener('click', () => {
    localStorage.removeItem('subastaya_user')
})

function getLoggedUser() {
    try {
        return JSON.parse(localStorage.getItem('subastaya_user'))
    } catch (error) {
        return null
    }
}