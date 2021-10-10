const express = require('express');
const app = express();



app.use(express.static('public'))

app.get("/", function(req,res){
    res.sendFile(__dirname+"/view/login/login.html")
})
app.get("/chat", function(req,res){
    console.log(req.url);
    res.sendFile(__dirname+"/view/chat/index.html")
})


// Redirecting from login to chat
app.post("/", function(req,res){
    res.redirect("/chat")
})


//server created
app.listen(3000, function () {
    console.log("Server running on PORT 3000");
  })