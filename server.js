
const express = require('express');
const bodyParser = require('body-parser')

const app = express()

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }))

// Including static files - CSS and JS
app.use(express.static('public'))

//home route - sign up
app.get("/", function (req, res) {
    res.render("login")
})

//chat route
app.get("/chat", function (req, res) {
    res.render('chat', {
        name: app.get('name_var'),
        linkedin: app.get('linkedin_var'),
        user: app.get('user_var'),
        github: app.get('github_var')
    });
})

//Video call route
app.get("/videocall", function (req, res) {
    res.render('videocall', {
        name: app.get('name_var'),
    });
})


//Chatcord
app.get("/chatcord", function (req, res) {
    res.render("chatcord")
})

//error route
app.get("/error", function (req, res) {

    res.render("error")
})

app.post("/", function (req, res) {

    app.set('name_var', req.body.Name);            // In "/" route store variable for "/chat" route
    app.set('linkedin_var', req.body.Linkedin);
    app.set('user_var', req.body.User);
    app.set('github_var', req.body.Github);

    if (req.body.PASSWORD == "fourmuskeeters" || req.body.PASSWORD == 100229) {
        res.redirect("/chat");

    }
    else {
        res.redirect("/error")
    }
})


app.post("/error", function (req, res) {
    res.redirect("/")
})


//server created
const server = app.listen(3000, function () {
    console.log("Server running on PORT 3000.");
})

//socket io connections
const io = require('socket.io')(server,{
    cors:{
        origin:"*"
    }
})

io.on('connection',(socket) =>{
    console.log("Welcome to Web-Connect " + socket.id)

    socket.on('sent_message', data =>{
        console.log(data)
        socket.broadcast.emit('sent_message', data)
    })

})

