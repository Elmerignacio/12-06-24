
const express = require('express');
const cookieParser = require('cookie-parser');

const Treasurer_route = require('./routes/Treasurer_route/Treasuser.route.js')
const Admin_route = require('./routes/Admin_route/Admin_route.js')
const Representative_route = require('./routes/REPRESENTATIVE_ROUTES/Representative_route.js')



const path = require('path');
require ("dotenv").config()
const session = require('express-session');
const middleware = require("./middleware/authmiddleware.js")

const app =  express()
app.use(cookieParser());


app.use(express.urlencoded({extended: true}));

app.set('views',[
  path.join(__dirname, 'views'),
  path.join(__dirname, 'views', 'ADMIN'),
  path.join(__dirname, 'views', 'TREASURER'),
  path.join(__dirname, 'views', 'REPRESENTATIVE')
]);


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')))
app.use(middleware.authenticateJWT)
app.use(Admin_route)
app.use(Treasurer_route)
app.use(Representative_route)


app.listen(process.env.PORT, ()=>{
  console.log("Connected to a server!!")
})
