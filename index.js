const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const e = require('express');
require("dotenv").config();


const port = process.env.PORT || 5000;


//middle wares
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4dokkij.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'});
    }
    const token= authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run(){
    try{
        const usersCollection = client.db("mobileGarage").collection("users");
        const productCollection = client.db('mobileGarage').collection('products');
        const categoryCollection = client.db('mobileGarage').collection('categoryOption');
        const ordersCollection = client.db('mobileGarage').collection('orders');
        const advertiseCollection = client.db('mobileGarage').collection('advertise');


        async function verifyAdmin(req, res, next){
            const decodedEmail = req.decoded.email;
            const filter = {email:decodedEmail};
            const user = await usersCollection.findOne(filter);
            if(user?.role !== 'admin'){
                return res.status(403).send({message: 'forbidden access'})
            }
            next();
        }
        async function verifySeller(req, res, next){
            const decodedEmail = req.decoded.email;
            const filter = {email:decodedEmail};
            const user = await usersCollection.findOne(filter);
            if(user?.type !== 'seller'){
                return res.status(403).send({message: 'forbidden access'})
            }
            next();
        }

        //get category
        app.get('/category', async(req, res) => {
            const query = {};
            const categories = await categoryCollection.find(query).toArray();
            res.send(categories);
        })
        
        //get products
        app.get('/category/:id', async(req, res) => {
            const id = req.params.id;
            const query = {categoryId:id};
            const products = await productCollection.find(query).toArray();
            res.send(products);
        })

        //------------delete user----
        app.delete('/users', verifyJWT, verifyAdmin, async(req, res) =>{
            const id = req.query.id;
            const query = {_id: ObjectId(id)};
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })

        //get seller
        app.get('/users/seller', verifyJWT, verifyAdmin,  async(req, res) =>{
            const query= {type:'seller'};
            const users = await usersCollection.find(query).toArray();
            res.send(users);

        })
        //get buyer
        app.get('/users/buyer', verifyJWT, verifyAdmin,  async(req, res) =>{
            const query= {type:'user'};
            const users = await usersCollection.find(query).toArray();
            res.send(users);

        })

        //-------------product API-------------
        app.post('/products', verifyJWT, verifySeller, async(req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        })

        app.get('/products', verifyJWT, verifySeller, async(req, res) => {

            const email = req.query.email;
            const query = {email:email};
            const products = await productCollection.find(query).toArray();
            res.send(products);

        })

        app.delete('/products', verifyJWT, verifySeller, async(req, res) =>{
            const id = req.query.id;
            const query = {_id: ObjectId(id)};
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })

        //---------order start---

        app.get('/order',verifyJWT, async(req, res) => {
            const email = req.query.email;
            const query = {email};
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders);
        })

        app.post('/order', verifyJWT, async(req, res) =>{
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        })

        app.delete('/order', async(req, res) => {
            const id= req.query.id;
            console.log(id);
            const query = {_id: ObjectId(id)};
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        })

        //--------------order end------------

        //----------advertise start------------
        app.get('/advertise', async(req, res) => {
            const query = {};
            const products = await advertiseCollection.find(query).toArray();
            res.send(products);
        })

        app.post('/advertise', verifyJWt,async(req, res) =>{
            const id = req.query.id;
            const advertiseProduct = req.body;
            const filter = {advertiseId:id};
            const product = await advertiseCollection.findOne(filter);
            if(!product){
                const result = await advertiseCollection.insertOne(advertiseProduct);
                res.send(result)
            }
            else{

                res.send({message:"Product is already advertised"});
            }
        })

        //----------advertise end-------------


        //isAdmin
        app.get('/users/admin/:email',  async(req, res) =>{
            const email = req.params.email;
            const query= {email}
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.role === 'admin'});
        })
        //isSeller
        app.get('/users/seller/:email', async(req, res) => {
            const email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            res.send({isSeller: user?.type === 'seller'})
        })

        //------------user
        app.post('/users', async(req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })


        //jwt
        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            const query = {email:email};
            const user= await usersCollection.findOne(query);
            if(user){

                const token = jwt.sign({email}, process.env.JWT_SECRET, {expiresIn:'8h'});
                res.send({accessToken:token});
            }

        })

    }
    finally{

    }
}
run().catch(err => console.log(err));



app.get('/', (req, res) => {
    res.send("Mobile Garage server is running.");
})


app.listen(port, () => {
    console.log(`Mobile garage server is running on port ${port}`)
})