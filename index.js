const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000

// Middleware
app.use(cors());
app.use(express.json());


// URI
const uri = "mongodb+srv://doctor_admin:<password>@cluster0.urspw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

app.get('/', (req, res) => {
  res.send('Hello Fromo dostors portal')
})

app.listen(port, () => {
  console.log(`Doctors app listening on port ${port}`)
})