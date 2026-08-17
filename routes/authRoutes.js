const express = require("express");

const {
    registerUser,
    loginUser
} = require("../controllers/authController");

const router = express.Router();


// =========================
// REGISTER
// =========================

router.get("/register", (req, res) => {
    res.render("register");
});

router.post("/register", registerUser);


// =========================
// LOGIN
// =========================

router.get("/login", (req, res) => {
    res.render("login");
});

router.post("/login", loginUser);


// =========================
// EXPORT
// =========================
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).send("Could not log out.");
        }

        res.redirect("/");
    });
});
module.exports = router;