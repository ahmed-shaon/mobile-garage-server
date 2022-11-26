const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const e = require('express');
require("dotenv").config();


const app = express();
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

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
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
            console.log(email);
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