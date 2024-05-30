const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const Album = require("../models/Album");
const multer = require('multer');
const Post = require("../models/Post");
const adminLayout = "../views/layouts/admin";
const path = require('path');
// Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/img/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
// 로그인 확인 미들웨어
const checkLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).send('<script>alert("잘못된 접근입니다"); window.location.href="/adminlogin";</script>');
  } 
  next();
};
//관리자 홈
router.get(
  "/adminmain",
  checkLogin,
  asyncHandler(async (req, res) => {
    const locals = { title: "allPosts", isLoggedIn: !!req.session.userId, username: req.session.username };
    const data = await Post.find();
    res.render("admin/home", { locals, data, layout: adminLayout });
  })
);

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
      res.redirect("/allPosts");
    } catch (error) {
      console.error(error);
      const errorMessage = "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      return res.status(500).send(`<script>alert("${errorMessage}"); window.location.href="/adminlogin";</script>`);
    }
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
      const { adminname, password, password2, name } = req.body;
      if (!adminname || !password|| !name) {
        return res.status(400).send('<script>alert("빈칸없이 작성하세요"); window.location.href="/adminregister";</script>');
      }else if (password!==password2){
        return res.status(400).send('<script>alert("비밀번호가 다릅니다."); window.location.href="/adminregister";</script>');
      }  const existingUser = await Admin.findOne({ adminname });
      if (existingUser) {
        return res.status(400).send('<script>alert("아이디가 존재합니다."); window.location.href="/adminregister";</script>');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await Admin.create({
        adminname,
        password: hashedPassword,
        name
      });
      res.status(400).send('<script>alert("회원가입이 완료되었습니다."); window.location.href="/adminregister";</script>');
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
    const locals = { title: "공지", isLoggedIn: !!req.session.userId, username: req.session.username };
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
    if(!title){
      return res.status(400).send('<script>alert("제목을 입력해 주세요.");</script>');
        
    } 
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
    await Post.deleteOne({ _id: req.params.id });
    res.redirect("/allPosts");
  })
);

// 상세 게시물 조회
router.get(
  "/admin/post/:id",
  checkLogin,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
    }
    res.render("admin/post", { data: post, layout: adminLayout });
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

// 모든 음반 조회
router.get(
  "/admin/products",
  checkLogin,
  asyncHandler(async (req, res) => {
    const locals = { title: "음반 목록" };
    const albums = await Album.find();
    res.render("admin/album/product", { locals, albums, layout: adminLayout });
    
  })
);

// 음반 추가 페이지
router.get(
  "/admin/products/add",
  checkLogin,
  asyncHandler(async (req, res) => {
    const locals = { title: "음반 추가" };
    res.render("admin/album/add", { locals, layout: adminLayout });
  })
);

// 음반 추가 처리
router.post(
  "/admin/products/add",
  checkLogin,
  upload.single('coverImage'),
  asyncHandler(async (req, res) => {
    try {
      const { title, artist, genre, description } = req.body;
      const coverImage = req.file ? req.file.filename : null;
      const newAlbum = new Album({ title, artist, genre, description, coverImage});
      await Album.create(newAlbum);
      res.redirect("/admin/products");
    } catch (error) {
      console.error(error);
      res.status(500).send('<script>alert("음반 추가 중 오류가 발생했습니다."); window.location.href="/admin/products/add";</script>');
    }
  })
);

// 음반 수정 페이지
router.get(
  "/admin/products/edit/:id",
  checkLogin,
  asyncHandler(async (req, res) => {
    const locals = { title: "음반 수정" };
    const album = await Album.findById(req.params.id);
    res.render("admin/album/edit", { locals, album, layout: adminLayout });
  })
);

// 음반 수정 처리
router.post(
  "/admin/products/edit/:id",
  checkLogin,
  upload.single('coverImage'),
  asyncHandler(async (req, res) => {
    try {
      const { title, artist, genre, description } = req.body;
      const coverImage = req.file ? req.file.filename : null;
      await Album.findByIdAndUpdate(req.params.id, { title, artist,  genre, description,coverImage });
      res.redirect("/admin/products");
    } catch (error) {
      console.error(error);
      res.status(500).send('<script>alert("음반 수정 중 오류가 발생했습니다."); window.location.href="/admin/products";</script>');
    }
  })
);

// 음반 삭제
router.post(
  "/admin/products/delete/:id",
  checkLogin,
  asyncHandler(async (req, res) => {
    try {
      await Album.findByIdAndDelete(req.params.id);
      res.redirect("/admin/products");
    } catch (error) {
      console.error(error);
      res.status(500).send('<script>alert("음반 삭제 중 오류가 발생했습니다."); window.location.href="/admin/products";</script>');
    }
  })
);

module.exports = router;
