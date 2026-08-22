require("dotenv").config();

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");

const path = require("path");

const pool = require("./middleware/config/db");

const authRoutes = require("./routes/authRoutes");

const session = require("express-session");

const dashboardRoutes = require("./routes/dashboardRoutes");

const jobRoutes = require("./routes/jobRoutes");

const recruiterRoutes = require("./routes/recruiterRoutes");

const publicRoutes = require("./routes/publicRoutes");

app.use("/uploads", express.static("uploads"));

app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("home");
});

pool.query("SELECT NOW()", (err, result) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Database connected successfully!");
        console.log("Database time:", result.rows[0].now);
    }
});
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
);
app.use("/", authRoutes);

app.use("/", dashboardRoutes);

app.use("/", jobRoutes);

app.use("/", recruiterRoutes);

app.use("/", publicRoutes);

app.use((req, res) => {
    res.status(404).render("404");
});

app.listen(PORT, () => {
    console.log(`JobVerse running on http://localhost:${PORT}`);
});