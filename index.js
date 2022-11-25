const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require('dotenv').config();
const books = require('./books.json')

// middleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res)=>{
    res.send('Bookshore server is running...')
})
app.get('/books', (req, res)=>{
    res.send(books)
})

app.listen(port, ()=>{
    console.log(`Bookshore server is running on port: ${port}`)
})