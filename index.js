const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require('dotenv').config();

// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1uor19o.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const productsCollection = client.db('bookShore').collection('products')
        const categoryCollection = client.db('bookShore').collection('categories')
        const userCollection = client.db('bookShore').collection('users')
        app.get('/categories', async(req, res)=>{
            const query = {}
            const result = await categoryCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/products', async(req, res)=>{
            const name = req.query.category
            const query = {category: name}
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })
        app.post('/products', async(req, res)=>{
            const product = req.body
            const result = await productsCollection.insertOne(product)
            res.send(result)
        })
        app.post('/users', async(req, res)=>{
            const user = req.body
            const userEmail = user.email
            const query = {email: userEmail}
            const response = await userCollection.find(query).toArray()
            if(response.length === 0){
                const result = await userCollection.insertOne(user)
                res.send(result)
            }
        })
        // app.get('/users', async(req, res)=>{
        //     const userEmail = req.query.email
        //     console.log(userEmail)
        //     const query = {email: userEmail}
        //     const result = await userCollection.find(query).toArray()
        //     res.send(result)
        // })
    }
    finally{}
}

run().catch(err=>console.error(err))


app.get('/', (req, res)=>{
    res.send('Bookshore server is running...')
})

app.listen(port, ()=>{
    console.log(`Bookshore server is running on port: ${port}`)
})