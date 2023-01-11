require('dotenv/config');

//INIT EXPRESS JS
const express = require('express')
const app = express();

//LOAD DATABASE SCHEMA
const Chat = require('./models/chat')
const User = require('./models/user');

//FUNCTION GENERATE RANDOM POSITION
const randomPosition = require('./functions/random_position')

//CONNECT TO DATABASE
const db = require('mongoose');
db.connect(process.env.DB_CONNECTION, () => {
    console.log('successfully connected')
});

//INIT HTTP SERVER AND SOCKET.IO
const server = require('http').createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});
const port = 3001;

app.get('/', async function (req, res) {
    res.status(200).send("Connected");
});

io.on('connection', (socket) => {
    console.log(`user connected ${socket.id}`);

    /*
    CHAT MESSAGE FROM CLIENT
    */
    socket.on('message_from_client', async (data) => {
        //INSERT MESSAGE IN DATABASE
        const insert = new Chat(data)
        await insert.save()
        //SEND THE MESSAGE TO THE REST OF PEOPLE
        socket.broadcast.emit("message_from_server", data)
    })

    /*
    FETCH MESSAGES ON PAGE LOAD
    */
    socket.on("fetch_messages", async () => {
        const list = await Chat.find().sort({ messageTime: 1 })
        //console.log(list)
        socket.emit("messages_list", list);
    })

    //FROM CLIENT-SIDE - CAR IS PASSED
    socket.on("car_passed", async (data) => {

        //GET LIST OF TOP USERS
        const topUsers = await User.find().sort({ passedCars: -1 }).select({ username: 1, passedCars: 1 });

        //IS THIS IS INQUIRY REQUEST? IF SO.. DON'T INCREASE THE PASSED CARS NUMBER
        const me = data.no_update ?
            //FETCH DATA WITHOUT UPDATING
            await User.findOne({ username: data.username }).select({ username: 1, passedCars: 1 })
            :
            //UPDATE RECORDS AND INCREASE THE PASSED CARS
            await User.findOneAndUpdate(
                { username: data.username },
                { $inc: { passedCars: 1 } }
            ).select({ username: 1, passedCars: 1 })


        //RESPOND
        socket.emit("serverResponse", {
            enemy: { position_1: randomPosition.generate(), position_2: me.passedCars > 20 ? randomPosition.generate() : false, tm: Date.now() },
            me: me,
            topUsers: topUsers,
            no_update: data.no_update ? true : false
        })

    })

    /*
    SIGNUP
    */
    socket.on("signup", async (data) => {
        let response;
        //CHECK IF USER NAME ALREADY EXISTS
        const result = await User.findOne({ username: data.username });

        if (result) {
            response = { status: 2, message: 'Username already exists' }
        }
        //VALIDATE PASSWORD
        else if (data.password != data.cpassword) {
            response = { status: 2, message: 'Password and confirm password does not match' }
        }
        else {
            const insert = new User({ username: data.username, password: data.password })
            await insert.save()

            response = {
                status: 1,
                username: data.username,
                password: data.password,
                user_level: 1,
                passed_cars: 0,
                logged_in: 1
            }
        }
        socket.emit("signup_status", response)
    })

    /*
    LOGIN
    */
    socket.on("login", async (data) => {
        let response;

        //CHECK USERNAME AND PASSWORD
        const result = await User.findOne({ username: data.username, password: data.password });

        if (result) {
            response = {
                status: 1,
                username: result.username,
                password: result.password,
                user_level: 1,
                passed_cars: result.passedCars,
                logged_in: 1
            }
        }
        else {
            response = { status: 2, message: 'Invalid login details' }
        }
        socket.emit("login_status", response)
    })

})

server.listen(port, function () {
    //console.log(`Listening on port`);
});