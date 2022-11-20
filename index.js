const express = require('express')
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000

//Middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gsxxpjk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run(){
    try{
        const appointmentCollection = client.db("doctorsPortal").collection("appointmentOption");
        const bookingsCollection = client.db('doctorsPortal').collection('bookings');
        const usersCollection = client.db('doctorsPortal').collection('users');
        
        app.get('/appointmentOption', async(req, res) =>{
            const date = req.query.date;
            const query = {}
            const options = await appointmentCollection.find(query).toArray();
            const bookingQuery = {appointmentDate: date};
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)
                const bookedSlots = optionBooked.map(book => book.slot);
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = remainingSlots;
            })
            res.send(options);
        });

        app.get('/bookings', async(req, res)=>{
            const email = req.query.email;
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);

        })

        app.post('/bookings', async(req, res) =>{
            const booking = req.body;
            const query = {
                appointmentDate: booking.appointmentDate,
                treatment: booking.treatment,
                email: booking.email
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if(alreadyBooked.length){
               const message = `You already have a booking on ${booking.appointmentDate}`;
               return res.send({acknowledged: false, message}) 
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

        app.post('/users', async(req, res) =>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

    }
    finally{

    }
}
run().catch(console.log);


app.get('/', (req, res) => {
  res.send('Doctors portal is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// DB_USER=doctorsPortal
// DB_PASS=sOcVvRSp7USt5kbR