const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const e = require('express');
require("dotenv").config();


const app = express();
const port = process.env.PORT || 5000;


//middle wares
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4dokkij.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const usersCollection = client.db("mobileGarage").collection("users");

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
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
            console.log(email);
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