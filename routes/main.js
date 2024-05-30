const express = require('express');
const router = express.Router();
const mainLayout = "../views/layouts/main.ejs";
const Post = require("../models/Post");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Album = require("../models/Album");
const Cart = require("../models/Cart");
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

// 공지 확인
router.get(
  "/post",
  asyncHandler(async (req, res) => {
    const locals = { title: "공지", isLoggedIn: !!req.cookies.token };
    const data = await Post.find();
    res.render("allPosts", { locals, data, layout: mainLayout });
  })
);


// 로그인 페이지
router.get("/login", asyncHandler(async (req, res) => {
  const locals = { isLoggedIn: !!req.cookies.token };
  res.render("login", { locals});
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
  const isValidPassword = await bcrypt.compare(password, user.password);//비교
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
router.post(
  "/join",
  asyncHandler(async (req, res) => {
    try {
      const { username, password, password2, birth,gender, job } = req.body;
      if (!username || !password) {
        return res.status(400).send('<script>alert("제대로 입력하세요."); window.location.href="/join";</script>');
      } else if(password !== password2){
        return res.status(400).send('<script>alert("비밀번호가 다릅니다"); window.location.href="/join";</script>');
      }
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).send('<script>alert("아이디가 존재합니다."); window.location.href="/join";</script>');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        username,
        password: hashedPassword,
        birth,
        gender,
        job
      });
      res.status(500).send('<script>alert("회원가입이 완료되었습니다."); window.location.href="/login";</script>');
    } catch (error) {
      console.error(error);
      res.status(500).send('<script>alert("회원가입 중 오류가 발생"); window.location.href="/join";</script>');
    }
  })
);

// 게시물 상세 보기
router.get('/post/:id', asyncHandler(async (req, res) => {
  try {
    const locals = { isLoggedIn: !!req.cookies.token };
    const data = await Post.findOne({ _id: req.params.id });
    if (!data) {
      return res.status(404).send('Post not found');
    }
    res.render('post', { locals, data, layout: mainLayout });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}));
// 음반 검색 페이지
router.get("/products", asyncHandler(async (req, res) => {
  const locals = { title: "음반 검색" , isLoggedIn: !!req.cookies.token};
  const searchQuery = req.query.search || "";
  const genreQuery = req.query.genre || "";
  let query = {};
  if (searchQuery) {
    query.title = { $regex: searchQuery, $options: "i" };
  }
  if (genreQuery) {
    query.genre = genreQuery;
  }
  const albums = await Album.find(query); // 대소문자 구분 없이 검색
  res.render("product", { locals, albums, layout: mainLayout });
}));


module.exports = router;
