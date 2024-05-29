const express = require("express");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const MongoStore = require("connect-mongo");
const app = express();
const connectDb = require("./config/db");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
require("dotenv").config();

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
  secret: process.env.SESSION_SECRET, // 세션 암호화에 사용할 비밀 키
  resave: true,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }), // 세션 저장소로 MongoDB 사용
  cookie: { secure: false } // HTTPS를 사용할 경우 true로 설정
}));

app.use(checkLoginStatus); // 세션 상태 확인 미들웨어 추가

app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", "./views");
app.set('layout', './layouts/main');
app.set('layout extractScripts', true);

app.use("/", require("./routes/main"));
app.use("/", require("./routes/admin"));

app.listen(port, () => {
  console.log(`서버가 ${port}에서 실행중입니다.`);
});
