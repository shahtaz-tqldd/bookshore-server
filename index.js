const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1uor19o.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(403).send('Unauthorized')
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded
        next();
    })
}
async function run() {
    try {
        const productsCollection = client.db('bookShore').collection('products')
        const categoryCollection = client.db('bookShore').collection('categories')
        const userCollection = client.db('bookShore').collection('users')
        const bookedProductCollection = client.db('bookShore').collection('bookedProducts')

        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const user = await userCollection.findOne(query)
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: "Only Admin is Authorized to do this Action" })
            }
            next()
        }

        app.get('/categories', async (req, res) => {
            const query = {}
            const result = await categoryCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/products', async (req, res) => {
            const name = req.query.category
            if (name) {
                const query = { category: name, status:'unsold' }
                const result = await productsCollection.find(query).toArray()
                res.send(result)
            }
            else {
                const query = {}
                const result = await productsCollection.find(query).toArray()
                res.send(result)
            }
        })
        app.post('/products', async (req, res) => {
            const product = req.body
            const result = await productsCollection.insertOne(product)
            res.send(result)
        })
        app.get('/my-products', verifyJWT, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = { sellerEmail: email }
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })
        app.post('/users', async (req, res) => {
            const user = req.body
            const userEmail = user.email
            const query = { email: userEmail }
            const response = await userCollection.find(query).toArray()
            if (response.length === 0) {
                const result = await userCollection.insertOne(user)
                res.send(result)
            }
        })
        app.get('/users', async (req, res) => {
            const query = {}
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })
        app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await userCollection.deleteOne(filter)
            res.send(result)
        })
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email }
            const user = await userCollection.findOne(filter)
            res.send({ isSeller: user?.userType === 'Seller' })
        })
        app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email }
            const user = await userCollection.findOne(filter)
            res.send({ isAdmin: user?.role === 'admin' })
        })
        app.put('/users/verify/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    verified: 'verified'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })
        app.get('/users/verified/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query)
            return res.send({ verifiedUser: user?.verified === 'verified' })

        })

        app.post('/products/booked', verifyJWT, async(req, res)=>{
            const bookedProduct = req.body
            const result = await bookedProductCollection.insertOne(bookedProduct)
            res.send(result)
        })

        app.get('/products/booked', verifyJWT, async(req, res)=>{
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = {buyerEmail: email}
            const result = await bookedProductCollection.find(query).toArray()
            res.send(result)
        })

        app.put('/products/:id', async(req, res)=>{
            const id = req.params.id
            const filter = {_id: ObjectId(id)}
            const options = {upsert : true}
            const updatedDoc = {
                $set:{
                    status: 'sold'
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })
        app.delete('/products/remove/:id', verifyJWT, async(req, res)=>{
            const id = req.params.id
            const filter = {_id: ObjectId(id)}
            const result = await productsCollection.deleteOne(filter)
            res.send(result)
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const user = await userCollection.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' })
                return res.send({ accessToken: token })
            }
            res.status(401).send({ accessToken: '' })
        })

    }
    finally { }
}

run().catch(err => console.error(err))


app.get('/', (req, res) => {
    res.send('Bookshore server is running...')
})

app.listen(port, () => {
    console.log(`Bookshore server is running on port: ${port}`)
})