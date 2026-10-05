require('dotenv').config()

const auctionId = process.env.TEST_AUCTION_ID
const tokenUser1 = process.env.TEST_TOKEN_USER_1
const tokenUser2 = process.env.TEST_TOKEN_USER_2
const amount = Number(process.env.TEST_BID_AMOUNT || 60000)

if (!auctionId || !tokenUser1 || !tokenUser2) {
  console.error(
    'Faltan TEST_AUCTION_ID, TEST_TOKEN_USER_1 o TEST_TOKEN_USER_2 en el .env'
  )
  process.exit(1)
}

const url = `http://localhost:3000/api/auctions/${auctionId}/bids`

async function makeBid(token, userLabel) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      amount
    })
  })

  const data = await response.json()

  return {
    usuario: userLabel,
    status: response.status,
    respuesta: data
  }
}

async function runTest() {
  console.log(`Subasta: ${auctionId}`)
  console.log(`Monto simultáneo: ${amount}`)
  console.log('Ejecutando dos pujas al mismo tiempo...\n')

  const results = await Promise.all([
    makeBid(tokenUser1, 'Usuario 1'),
    makeBid(tokenUser2, 'Usuario 2')
  ])

  console.log(results)
}

runTest().catch(error => {
  console.error('Error ejecutando la prueba:', error)
})