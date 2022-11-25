const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require('dotenv').config();
const books = require('./books.json')

// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1uor19o.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const collection = client.db("test").collection("devices");

async function run(){
    try{
        const productsCollection = client.db('bookShore').collection('products')
        app.get('/products', async(req, res)=>{
            const query = {}
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })
    }
    finally{}
}

run().catch(err=>console.error(err))


app.get('/', (req, res)=>{
    res.send('Bookshore server is running...')
})
app.get('/books', (req, res)=>{
    res.send(books)
})

app.listen(port, ()=>{
    console.log(`Bookshore server is running on port: ${port}`)
})