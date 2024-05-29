const express = require('express');
const router = express.Router();
const mainLayout = "../views/layouts/main.ejs";
const Post = require("../models/Post");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

// 로그인 확인 미들웨어
const checkLogin = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send('<script>alert("잘못된 접근입니다"); window.location.href="/login";</script>');
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).send('<script>alert("잘못된 접근입니다"); window.location.href="/login";</script>');
  }
};

// 관리자 로그인 페이지
router.get("/adminlogin", (req, res) => {
  res.render("./adminlogin", { layout: mainLayout });
});
// 홈 페이지
router.get(["/", "/home"], asyncHandler(async (req, res) => {
  const locals = { title: "Home", isLoggedIn: !!req.cookies.token };
  const data = await Post.find({});
  res.render("home", { locals, data, layout: mainLayout });
}));

// 커뮤니티 페이지
router.get("/post", asyncHandler(async (req, res) => {
  const locals = { title: "post", isLoggedIn: !!req.cookies.token };
  const data = await Post.find({});
  res.render("post", { locals, data, layout: mainLayout });
}));

// 로그인 페이지
router.get("/login", asyncHandler(async (req, res) => {
  const locals = { title: "로그인 페이지", isLoggedIn: !!req.cookies.token };
  res.render("login", { locals, layout: mainLayout });
}));

// 로그아웃
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

// 로그인 처리
router.post("/login", asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).send('<script>alert("일치하는 사용자가 없습니다."); window.location.href="/login";</script>');
  }
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).send('<script>alert("비밀번호가 일치하지 않습니다."); window.location.href="/login";</script>');
  }
  const token = jwt.sign({ id: user._id }, jwtSecret);
  res.cookie("token", token, { httpOnly: true });
  
  res.redirect("/home");
}));

// 회원가입 페이지
router.get("/join", asyncHandler(async (req, res) => {
  const locals = { title: "회원가입", isLoggedIn: !!req.cookies.token };
  res.render("join", { locals, layout: mainLayout });
}));

// 게시물 상세 보기
router.get("/home/:id", asyncHandler(async (req, res) => {
  const data = await Post.findOne({ _id: req.params.id });
  res.render("post", { data, layout: mainLayout });
}));

module.exports = router;
