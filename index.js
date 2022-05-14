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
    const bookingCollection = client.db('doctors_portal').collection('bookings');

    // api for get data from database
    app.get('/service', async(req, res)=> {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    })

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
    app.get('/booking', async(req, res)=> {
      const patient = req.query.patient;
      const query = {patient: patient};
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
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