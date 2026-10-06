require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const pool = require("./middleware/config/db");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const jobRoutes = require("./routes/jobRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const publicRoutes = require("./routes/publicRoutes");

const app = express();
const PORT = process.env.PORT || 3000;


// =====================================
// VIEW ENGINE
// =====================================

app.set("view engine", "ejs");


// =====================================
// MIDDLEWARE
// =====================================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// =====================================
// SESSION
// =====================================

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
);
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// =====================================
// HOME PAGE
// =====================================

app.get("/", (req, res) => {
    res.render("home");
});


// =====================================
// ROUTES
// =====================================

app.use("/", authRoutes);

app.use("/", dashboardRoutes);

app.use("/", jobRoutes);

app.use("/", recruiterRoutes);

app.use("/", publicRoutes);


// =====================================
// DATABASE TEST
// =====================================

pool.query("SELECT NOW()", (err, result) => {
    if (err) {
        console.error(
            "Database connection failed:",
            err.message
        );
    } else {
        console.log(
            "Database connected successfully!"
        );

        console.log(
            "Database time:",
            result.rows[0].now
        );
    }
});


// =====================================
// 404 PAGE
// =====================================

app.use((req, res) => {
    res.status(404).render("404");
});


// =====================================
// START SERVER
// =====================================

app.listen(PORT, () => {
    console.log(
        `JobVerse running on http://localhost:${PORT}`
    );
});