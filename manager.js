const express = require('express')
const fs = require('fs');
const app = express()
const port = 3000

app.get('/manager', (req, res) => res.send(fs.readFileSync('data.js', 'utf8')))

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))