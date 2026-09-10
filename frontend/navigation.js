const navigationTemplate = `
    <header class="site-header">
        <a class="brand" href="catalogo.html">SubastaYa</a>
        <nav class="main-nav" aria-label="Navegación principal">
            <a href="catalogo.html">Subastas</a>
            <a href="catalogo.html#categorias">Categorías</a>
            <button class="nav-link-disabled" type="button" aria-disabled="true">Vender</button>
            <div class="profile">
                <button class="profile-trigger" type="button" aria-expanded="false" aria-controls="profile-menu">
                    <span class="profile-icon">SY</span>
                    <span>Perfil</span>
                </button>
                <div class="profile-menu" id="profile-menu" hidden>
                    <a href="mis-actividades.html#pujas">Mis pujas</a>
                    <a href="mis-actividades.html#compras">Mis compras</a>
                    <a href="mis-actividades.html#publicaciones">Mis publicaciones</a>
                    <a href="billetera.html">Mi billetera</a>
                    <a href="mis-actividades.html#perfil">Perfil</a>
                    <a href="index.html" data-logout>Cerrar sesión</a>
                </div>
            </div>
        </nav>
    </header>
`

document.querySelector('[data-app-header]').innerHTML = navigationTemplate

const profileTrigger = document.querySelector('.profile-trigger')
const profileMenu = document.querySelector('.profile-menu')

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