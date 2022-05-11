const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000

// Middleware
app.use(cors());
app.use(express.json());


// URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.urspw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// client connection
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// async await function
async function run(){
  try{
    await client.connect();
    const serviceCollection = client.db('doctors_portal').collection('services');

    // api
    app.get('/service', async(req, res)=> {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    })
  }
  finally{

  }
}

// call run function
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello Fromo dostors portal')
})

app.listen(port, () => {
  console.log(`Doctors app listening on port ${port}`)
})