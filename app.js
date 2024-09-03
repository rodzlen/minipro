const express = require("express");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const MongoStore = require("connect-mongo");
const connectDb = require("./config/db");
const mainRoutes = require('./routes/main');
const adminRoutes = require('./routes/admin');
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
      require("dotenv").config();


const app = express();
const port = process.env.PORT || 1000;
connectDb();

const checkLoginStatus = (req, res, next) => {
  res.locals.isLoggedIn = !!req.session.userId;
  next();
};


app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }), 
  cookie: { httpOnly: true, secure: false  } 
}));

app.use(checkLoginStatus); 

app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", "./views");
app.set('layout', './layouts/main');
app.set('layout extractScripts', true);

app.use('/', mainRoutes);
app.use('/', adminRoutes);


app.listen(port, () => {
  console.log(`서버가 ${port}에서 실행중입니다.`);
});
