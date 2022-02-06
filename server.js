const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const databaseURL = require(__dirname + "/public/js/mongoDB.js");
mongoose.connect( databaseURL ,
  {
    useNewUrlParser: true,
  }
);
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");
const { PassThrough } = require("stream");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

// Including static files - CSS and JS
app.use(express.static("public"));

// MongoDB - mongoose database :

//Schema structure
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is compulsory"],
  },
  password: {
    type: String,
    required: [true, "Password is compulsory"],
  },
});

// collection in database (model)
const User = mongoose.model("User", userSchema);

// default users
const ansh = new User({
  name: "Ansh Chauhan",
  password: "ansh123",
});
const subs = new User({
  name: "Subhransu Majhi",
  password: "subs123",
});
const anant = new User({
  name: "Anant Dubey",
  password: "anant123",
});

const defaultUsers = [ansh, subs, anant];

//home route - sign up
app.get("/", function (req, res) {
  User.find(function (err, users) {
    if (users.length === 0) {
      User.insertMany(defaultUsers, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Default users sucessfully saved");
        }
      });
      res.redirect("/");
    }
    if (err) {
      console.log(err);
    } else {
      res.render("login");
    }
  });
});

//chat route
app.get("/chat", function (req, res) {
  res.render("chat", {
    name: app.get("name_var"),
    linkedin: app.get("linkedin_var"),
    user: app.get("user_var"),
    github: app.get("github_var"),
  });
});

//Video call route
app.get("/videocall", function (req, res) {
  res.render("videocall", {
    name: app.get("name_var"),
  });
});

//error route
app.get("/error", function (req, res) {
  res.render("error");
});

app.post("/", function (req, res) {
  app.set("name_var", req.body.Name); // In "/" route store variable for "/chat" route
  app.set("linkedin_var", req.body.Linkedin);
  app.set("user_var", req.body.User);
  app.set("github_var", req.body.Github);

  var email = req.body.User;
  var NAME = req.body.Name;
  var pass = req.body.PASSWORD;

  // storing documents in database -> Sign in
  if (req.body.btn1 === "signIn") {
    if (NAME === "" || pass === "" || email === "") {
      res.redirect("/error");
    } else {
        const newUser = new User({
          name: NAME,
          password: pass,
        });
      // Logic behind vitbhopal domain signIn only
      var pattern = "vitbhopal.ac.in";
      var count = 0;
      for (let j = email.length - 15; j < email.length; j++) {
        if (email[j] != pattern[count]) {
          break;
        }
        count++;
      }
      if (count == pattern.length) {
        newUser.save();
        res.redirect("/chatcordLogin");
      } else {
        res.redirect("/error");
      }
    }
  }
  if (req.body.btn2 === "login") {
    User.find({ name: NAME }, function (err, users) {
      if (err) {
        console.log(err);
      }
      if (!users.length) {
        res.redirect("/error");
      } else {
        users.forEach(function (user) {
          if (pass === user.password) {
            res.redirect("/chatcordLogin");
          } else {
            res.redirect("/error");
          }
        });
      }
    });
  }
});

app.post("/error", function (req, res) {
  res.redirect("/");
});

//server created
const server = app.listen(process.env.PORT || 3000, function () {
  console.log("Server running on PORT 3000.");
});

//socket io connections
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Welcome to Web-Connect " + socket.id);

  socket.on("sent_message", (data) => {
    console.log(data);
    socket.broadcast.emit("sent_message", data);
  });
});

//users list
app.get("/users", function (req, res) {
  User.find(function (err, users) {
    if (err) {
      console.log(err);
    } else {
      res.render("users", { key: users });
    }
  });
});

//Chatcord
app.get("/chatcordLogin", function (req, res) {
  res.render("chatcordLogin");
});

app.post("/chatcordLogin", function (req, res) {
  res.redirect("/chatcord");
});

app.get("/chatcord", function (req, res) {
  res.render("chatcord");
});

app.post("/chatcord", function (req, res) {
  res.redirect("/chatcordLogin");
});

const botName = "WebConnect Bot ";

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit(
      "message",
      formatMessage(botName, "Welcome to Web-Connect Queries!")
    );

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});
