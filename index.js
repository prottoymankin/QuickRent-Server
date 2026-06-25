const dns = require('node:dns');
dns.setServers(['1.1.1.1', '1.0.0.1']); 

const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
    
    const bookingCollection = database.collection('bookings');
    const favoritePropertyCollection = database.collection('favorites');
    const propertyCollection = database.collection('properties');
    const userCollection = database.collection('user');

    app.post ('/api/bookings', async (req, res) => {
      const bookingData = {
        ...req.body,
        createdAt: new Date()
      };

      const result = await bookingCollection.insertOne(bookingData);
      res.send(result);
    });

    app.patch('/api/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const { bookingStatus } = req.body;
      
      const query = { _id: new ObjectId(id) };
      
      const update = {
        $set: {
          bookingStatus
        }
      };
  
      const result = await bookingCollection.updateOne(query, update);

      res.send(result);
    });

    app.get('/api/bookings/:id', async (req, res) => {
      const id = req.params.id;

      const query = { tenantId: id};

      const result = await bookingCollection
        .find(query)
        .sort({createdAt: -1})
        .toArray();

      res.send(result);
    });

    app.get('/api/bookings/owner/:id', async (req, res) => {
      const id = req.params.id;
      
      const query = { ownerId: id };

      const result = await bookingCollection
        .find(query)
        .sort({createdAt: -1})
        .toArray();

      res.send(result);
    });

    app.get('/api/bookings', async (req, res) => {
      const result = await bookingCollection
        .find({})
        .sort({createdAt: -1})
        .toArray();
      
      res.send(result);
    });

    app.get('/api/favorites/:userId', async (req, res) => {
      const userId = req.params.userId;

      const favorites = await favoritePropertyCollection.find({userId}).toArray();

      const propertyIds = favorites.map(favorite => new ObjectId(favorite.propertyId));

      const properties = await propertyCollection.find({
        _id: {
          $in: propertyIds
        }
      }).toArray();

      res.send(properties);
    });

    app.post('/api/favorites', async (req, res) => {
      const existing = await favoritePropertyCollection.findOne({
        userId: req.body.userId,
        propertyId: req.body.propertyId
      });

      if (existing) {
        return res.status(409).send({
          message: "Already added to favorite"
        });
      }

      const favoritePropertyData = {
        ...req.body,
        createdAt: new Date()
      };

      const result = await favoritePropertyCollection.insertOne(favoritePropertyData);

      res.send(result);
    });

    app.delete('/api/favorites', async (req, res) => {
      const { userId, propertyId } = req.query;
      const result = await favoritePropertyCollection.deleteOne({
        userId,
        propertyId
      });
      res.send(result);
    });

    app.get('/api/users', async(req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });

    app.patch('/api/users', async(req, res) => {
      const { userId, newRole } = req.body;

      const query = { _id: new ObjectId(userId) };

      const update = {
        $set: {
          role: newRole
        }
      };

      const result = await userCollection.updateOne(query, update);

      res.send(result);
    });

    app.patch('/api/properties', async (req, res) => {
      const { propertyId, newStatus } = req.body;

      const query = { _id: new ObjectId(propertyId) };

      const update = {
        $set: {
          status: newStatus
        }
      };

      const result = await propertyCollection.updateOne(query, update);
      res.send(result);
    });

    app.patch('/api/properties/:id', async (req, res) => {
      const id = req.params.id;

      const update = req.body;

      const query = { _id: new ObjectId(id) };

      const result = await propertyCollection.updateOne(query, {
        $set: update
      });
      
      res.send(result);
    });

    app.post('/api/properties', async (req, res) => {
      const propertyData = {
        ...req.body,
        createdAt: new Date()
      };

      const result = await propertyCollection.insertOne(propertyData);
      res.send(result);
    });

    app.get('/api/properties', async (req, res) => {
      const result = await propertyCollection.find({}).sort({ createdAt: -1 }).toArray();
      res.send(result);
    });

    app.get('/api/properties/approved', async (req, res) => {
      const query = { status: 'Approved' };
      const result = await propertyCollection.find(query).sort({ createdAt: -1 }).toArray();
      res.send(result);
    });

    app.get('/api/my-properties', async (req, res) => {
      const query = {};
      
      if (req.query.ownerId) {
        query.ownerId = req.query.ownerId;
      }
      
      const result = await propertyCollection.find(query).sort({ createdAt: -1 }).toArray();
      res.send(result);
    });

    app.get('/api/properties/featured', async (req, res) => {
      const result = await propertyCollection.find({}).sort({createdAt: -1}).limit(6).toArray();
      res.send(result);
    });

    app.get('/api/properties/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await propertyCollection.findOne(query);
      res.send(result);
    });

    app.delete('/api/properties/:id', async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await propertyCollection.deleteOne(query);

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