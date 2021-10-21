
const express = require('express');
const bodyParser = require('body-parser')
const app = express();


app.use(bodyParser.urlencoded({ extended: true }))

// Including static files - CSS and JS
app.use(express.static('public'))

//home route - sign up
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/view/login/login.html")
})

//chat route
app.get("/chat", function (req, res) {

    res.sendFile(__dirname + "/view/chat/chat.html")
})

//error route
app.get("/error", function (req, res) {

    res.sendFile(__dirname+"/view/error/error.html")
})


// Redirecting from login to chat



app.post("/", function (req, res) {
    if (req.body.PASSWORD == "fourmuskeeters" || req.body.PASSWORD == 100229) {
        res.redirect("/chat")
    }
    else{
        res.redirect("/error")
    }
})


app.post("/error", function (req, res) {
    res.redirect("/")
})

//server created
app.listen(3000, function () {
    console.log("Server running on PORT 3000.");
})