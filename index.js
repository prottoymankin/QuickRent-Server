const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');

dotenv.config();

const app = express();
const port = process.env.PORT;
const uri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    
    const database = client.db('quickrent_db');
    
    const propertyCollection = database.collection('properties');
    const userCollection = database.collection('user');

    app.get('/api/users', async(req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });

    app.post('/api/properties', async (req, res) => {
      const propertyData = req.body;
      const result = await propertyCollection.insertOne(propertyData);
      res.send(result);
    });

    app.get('/api/my-properties', async (req, res) => {
      const query = {};
      
      if (req.query.ownerId) {
        query.ownerId = req.query.ownerId;
      }
      
      const result = await propertyCollection.find(query).toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})