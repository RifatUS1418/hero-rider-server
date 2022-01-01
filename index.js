const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const fileUpload = require('express-fileupload');
const stripe = require('stripe')(process.env.STRIPE_SECRET)

const port = process.env.PORT || 5000;





app.use(cors());
app.use(express.json());
app.use(fileUpload());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lgbbe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db('hero_rider');
        const driverCollection = database.collection('driverUser');
        const learnerCollection = database.collection('learnerUser');
        const packageCollection = database.collection('packages');
        const paymentCollection = database.collection('payment');

        // Driver API
        app.post('/driverUser', async (req, res) => {
            const name = req.body.name;
            const email = req.body.email;
            const age = req.body.age;
            const address = req.body.address;
            const phone = req.body.phone;
            const vehicleInfo = req.body.vehicleInfo;
            const vehicle = req.body.vehicle;
            const area = req.body.area;
            console.log(req.body)
            console.log(req.files)
            const profilePic = req.files.profileImage;
            const profilePicData = profilePic.data;
            const encodedProfilePic = profilePicData.toString('base64');
            const imageProfileBuffer = Buffer.from(encodedProfilePic, 'base64');

            const nidPic = req.files.nidImage;
            const nidPicData = nidPic.data;
            const encodedNidPic = nidPicData.toString('base64');
            const imageNidBuffer = Buffer.from(encodedNidPic, 'base64');

            const licencePic = req.files.licenceImage;
            const licencePicData = licencePic.data;
            const encodedLicencePic = licencePicData.toString('base64');
            const imageLicenceBuffer = Buffer.from(encodedLicencePic, 'base64');
            const driver = {
                name,
                email,
                age,
                address,
                phone,
                vehicleInfo,
                vehicle,
                area,
                profileImage: imageProfileBuffer,
                nidImage: imageNidBuffer,
                licenceImage: imageLicenceBuffer
            }
            const result = await driverCollection.insertOne(driver);
            res.json(result);
        })



        //Learner API
        app.post('/learnerUser', async (req, res) => {
            const name = req.body.name;
            const email = req.body.email;
            const age = req.body.age;
            const address = req.body.address;
            const phone = req.body.phone;
            const vehicle = req.body.vehicle;
            console.log(req.files)
            const profilePic = req.files.profileImage;
            const profilePicData = profilePic.data;
            const encodedProfilePic = profilePicData.toString('base64');
            const imageProfileBuffer = Buffer.from(encodedProfilePic, 'base64');

            const nidPic = req.files.nidImage;
            const nidPicData = nidPic.data;
            const encodedNidPic = nidPicData.toString('base64');
            const imageNidBuffer = Buffer.from(encodedNidPic, 'base64');

            const learner = {
                name,
                email,
                age,
                address,
                phone,
                vehicle,
                profileImage: imageProfileBuffer,
                nidImage: imageNidBuffer
            }
            const result = await learnerCollection.insertOne(learner);
            res.json(result);
        })

        // Driver API
        app.get('/driveUser', async (req, res) => {
            console.log(req.query);
            const cursor = driverCollection.find({});
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let driver;
            const count = await cursor.count();
            if (page) {
                driver = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                driver = await cursor.toArray();
            }

            res.json({
                count,
                driver
            });
        })
        // Learner API
        app.get('/learnerUser', async (req, res) => {
            const cursor = learnerCollection.find({});
            const learners = await cursor.toArray();
            const count = await cursor.count();
            res.json({
                count,
                learners
            });
        })

        // Package API
        app.get('/packages', async (req, res) => {
            const cursor = packageCollection.find({});
            const packages = await cursor.toArray();
            res.json(packages);
        })

        app.get('/packages/payment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await packageCollection.findOne(query);
            res.json(result);
        })

        // user API
        app.get('/learnerUser/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { email: email };
            const user = await learnerCollection.findOne(query);
            res.json(user);
        })
        // admin API
        app.get('/driverUser/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { email: email };
            console.log(query);
            const user = await driverCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin, user: user })
        })


        // make admin API
        app.put('/driverUser', async (req, res) => {
            const user = req.body;
            console.log('put', user);
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await driverCollection.updateOne(filter, updateDoc);
            res.json(result);

        })

        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
            })
            res.json({ clientSecret: paymentIntent.client_secret })
        })

        app.post('/payment', async (req, res) => {
            const paymentInfo = req.body;
            console.log(paymentInfo);
            const result = await paymentCollection.insertOne(paymentInfo);
            res.json(result)
        })
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Hero Rider')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})