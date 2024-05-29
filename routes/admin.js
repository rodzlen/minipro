const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const Post = require("../models/Post");
const adminLayout = "../views/layouts/admin";

// 로그인 확인 미들웨어
const checkLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).send('<script>alert("잘못된 접근입니다"); window.location.href="/adminlogin";</script>');
  }
  next();
};
//관리자 홈
router.get("/adminmain", (req, res) => {
  res.render("./admin/allPosts", { layout: adminLayout });
});


// 관리자 로그인 처리
router.post(
  "/adminlogin",
  asyncHandler(async (req, res) => {
    const { adminname, password } = req.body;
    try {
      const admin = await Admin.findOne({ adminname });
      if (!admin) {
        return res.status(401).send('<script>alert("일치하는 사용자가 없습니다."); window.location.href="/adminlogin";</script>');
      }
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).send('<script>alert("비밀번호가 일치하지 않습니다."); window.location.href="/adminlogin";</script>');
      }
      req.session.userId = admin._id; // 세션에 사용자 ID 저장
      req.session.username = admin.adminname; // 세션에 사용자 이름 저장
      res.redirect("/allPosts");
    } catch (error) {
      console.error(error);
      const errorMessage = "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      return res.status(500).send(`<script>alert("${errorMessage}"); window.location.href="/adminlogin";</script>`);
    }
    checkLogin
  })
);

// 관리자 등록 페이지
router.get(
  "/adminregister",
  checkLogin,
  asyncHandler(async (req, res) => {
    res.render("admin/adminregister", { layout: adminLayout });
  })
);

// 관리자 등록 처리
router.post(
  "/adminregister",
  checkLogin,
  asyncHandler(async (req, res) => {
    try {
      const { adminname, password } = req.body;
      if (!adminname || !password) {
        return res.status(400).send('<script>alert("관리자 이름과 비밀번호를 입력해주세요."); window.location.href="/adminregister";</script>');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await Admin.create({
        adminname,
        password: hashedPassword,
      });
      res.json(`user created : ${admin}`);
    } catch (error) {
      console.error(error);
      res.status(500).send('<script>alert("관리자 등록 중 오류가 발생했습니다."); window.location.href="/adminregister";</script>');
    }
  })
);

// 모든 게시물 조회
router.get(
  "/allPosts",
  checkLogin,
  asyncHandler(async (req, res) => {
    const locals = { title: "Posts", isLoggedIn: !!req.session.userId, username: req.session.username };
    const data = await Post.find();
    res.render("admin/allPosts", { locals, data, layout: adminLayout });
  })
);

// 게시물 작성 페이지
router.get(
  "/add",
  checkLogin,
  asyncHandler(async (req, res) => {
    const locals = { title: "게시물 작성" };
    res.render("admin/add", { locals, layout: adminLayout });
  })
);

// 게시물 작성 처리
router.post(
  "/add",
  checkLogin,
  asyncHandler(async (req, res) => {
    const { title, body } = req.body;
    const newPost = new Post({ title, body, createdBy: req.session.userId });
    await Post.create(newPost);
    res.redirect("/allPosts");
  })
);

// 게시물 편집 페이지
router.get(
  "/edit/:id",
  checkLogin,
  asyncHandler(async (req, res) => {
    const locals = { title: "게시물 편집" };
    const data = await Post.findOne({ _id: req.params.id });
    res.render("admin/edit", { locals, data, layout: adminLayout });
  })
);

// 게시물 편집 처리
router.put(
  "/edit/:id",
  checkLogin,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (post.createdBy.toString() !== req.session.userId) {
      return res.status(401).send('<script>alert("권한이 없습니다."); window.location.href="/allPosts";</script>');
    }
    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      createdAt: Date.now(),
    });
    res.redirect("/allPosts");
  })
);

// 게시물 삭제
router.delete(
  "/delete/:id",
  checkLogin,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (post.createdBy.toString() !== req.session.userId) {
      return res.status(401).send('<script>alert("권한이 없습니다."); window.location.href="/allPosts";</script>');
    }
    await Post.deleteOne({ _id: req.params.id });
    res.redirect("/allPosts");
  })
);

// 게시물 조회
router.get(
  "/post/:id",
  checkLogin,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
    }
    res.render("post", { data: post, layout: adminLayout });
  })
);

// 로그아웃
router.get("/adminlogout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('<script>alert("로그아웃 중 오류가 발생했습니다."); window.location.href="/allPosts";</script>');
    }
    res.redirect("/adminlogin");
  });
});

module.exports = router;
