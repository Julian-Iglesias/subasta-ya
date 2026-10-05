const token = process.env.TEST_TOKEN

const bidA = {
  url: 'http://localhost:3000/api/auctions/154/bids',
  amount: 80000
}

const bidB = {
  url: 'http://localhost:3000/api/auctions/155/bids',
  amount: 80000
}

const sendBid = async ({ url, amount }) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ amount })
  })

  const body = await response.json().catch(() => ({}))

  return {
    status: response.status,
    body
  }
}

const runTest = async () => {
  console.log('Prueba de concurrencia de billetera')
  console.log('Mismo usuario, dos subastas, dos pujas simultáneas')

  const results = await Promise.all([
    sendBid(bidA),
    sendBid(bidB)
  ])

  console.log(results)
}

runTest()