const url = 'http://localhost:3000/api/auctions/1/bids'

const sendBid = async (userId) => {
    const response = await fetch(url, {
        method: 'POST',headers: {'Content-Type': 'application/json'},body: JSON.stringify({userId,amount: 60000})})
    const body = await response.json()
    return {userId,status: response.status,body}
}

const runTest = async () => {
    const results = await Promise.all([sendBid(2),sendBid(52)])
    console.log(results)
}
runTest()