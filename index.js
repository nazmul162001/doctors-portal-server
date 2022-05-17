const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const verify = require('jsonwebtoken/verify');

const app = express();
const port = process.env.PORT || 5000

// Middleware
app.use(cors());
app.use(express.json());


// URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.urspw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// client connection
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verify jwt
function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: 'UnAuthorized access'});
  }
  // verify token
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
    if(err){
      return res.status(403).send({message: 'Forbidden access'})
    }
    req.decoded = decoded;
    next();
  })
}



// async await function
async function run(){
  try{
    await client.connect();
    const serviceCollection = client.db('doctors_portal').collection('services');
    const bookingCollection = client.db('doctors_portal').collection('bookings');
    const userCollection = client.db('doctors_portal').collection('users');
    const doctorCollection = client.db('doctors_portal').collection('doctors');


    // verify admin for added doctor
    const verifyAdmin = async(req,res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({email: requester});
      if(requesterAccount.role === 'admin'){
        next();
      }
      else{
        res.status(403).send({message: 'forbidden'});
      }
    }

    // api for get data from database
    app.get('/service', async(req, res)=> {
      const query = {};
      const cursor = serviceCollection.find(query).project({name: 1});
      const services = await cursor.toArray();
      res.send(services);
    })

    // api for all users
    app.get('/user', verifyJWT , async(req,res)=>{
      const users = await userCollection.find().toArray();
      res.send(users);
    })
    

    // put api
    app.put('/user/:email', async(req, res)=> {
      const email = req.params.email;
      const user = req.body;
      const filter = {email: email}
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
    const result = await userCollection.updateOne(filter, updateDoc, options);
    const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
    res.send({result, token});
    })

    // api for Access all user only for admin
    app.get('/admin/:email',async(req, res)=> {
      const email = req.params.email;
      const user = await userCollection.findOne({email: email});
      const isAdmin = user.role === 'admin';
      res.send({admin: isAdmin})
    })

    // put api for admin users
    app.put('/user/admin/:email', verifyJWT, verifyAdmin,   async(req, res)=> {
      const email = req.params.email;
        const filter = {email: email}
        const updateDoc = {
          $set: {role: 'admin'},
        };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    // api for available slots
    app.get('/available', async(req,res)=> {
      const date = req.query.date;
      console.log(date);

      // step 1: get all services
      
      const services = await serviceCollection.find().toArray();
      

      // step 2: get the booking of that day. output: [{}, {}, {}, {}, {}]
      const query = {date: date};
      const booking = await bookingCollection.find(query).toArray();
      console.log(booking, services);

      //step 3: for each service, find booking for that service

      services.forEach(service => {
        // setp 4: find bookings for that service. output: [{}, {}, {}]
        const serviceBookings = booking.filter(book => book.treatment === service.name);
        //step 5: select slot for the service bookings: output: ['', '', '', '']
        const bookedSlots = serviceBookings.map(book => book.slot);
        // step 6: select those slots that are not in bookedSlotsSlot
        const available = service.slots.filter(slot => !bookedSlots.includes(slot));
        // console.log(available);
        // step 7: set available slots to make it easier
        service.slots = available;
      })

      res.send(services);
    })

    // get booking data for dashboard
    app.get('/booking', verifyJWT, async(req, res)=> {
      const patient = req.query.patient;
      const decodedEmail = req.decoded.email;
      if(patient === decodedEmail){
        const query = {patient: patient};
        const bookings = await bookingCollection.find(query).toArray();
        return res.send(bookings);
      }
      else{
        return res.status(403).send({message: 'forbidden access'})
      }
    })

    // api for create new booking
    app.post('/booking', async(req,res)=>{
      const booking = req.body;
      // check condition for booking per 1 user
      const  query = {treatment: booking.treatment, date: booking.date, patient: booking.patient}
      const exists = await bookingCollection.findOne(query);
      if(exists){
        return res.send({success: false, booking: exists})
      }
      const result = await bookingCollection.insertOne(booking);
      return res.send({success: true, result});
    })

    // api for manage all doctor
    app.get('/doctor', verifyJWT, verifyAdmin,  async(req,res)=> {
      const doctors = await doctorCollection.find().toArray();
      res.send(doctors);
    })

    // api for img upload
    app.post('/doctor', verifyJWT, verifyAdmin,   async(req,res)=> {
      const doctor = req.body;
      const result = await doctorCollection.insertOne(doctor);
      res.send(result);
    })
    
    // api for delete doctors 
    
    app.delete('/doctor/:email', verifyJWT, verifyAdmin,   async(req,res)=> {
      const email = req.params.email;
      const filter = {email: email};
      const result = await doctorCollection.deleteOne(filter);
      res.send(result);
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