const express = require("express");
const {
    getCompaniesFromJobs
} = require("../services/jobService");
const pool = require("../middleware/config/db");
const { getTopCompanies } = require("../services/jobService");
const router = express.Router();

// ABOUT
router.get("/about", (req, res) => {
    res.render("about");
});

// COMPANIES
router.get("/companies", async (req, res) => {

    try {

        const keyword =
            req.query.keyword ||
            "software developer";

        const location =
            req.query.location ||
            "india";


        const companies =
            await getCompaniesFromJobs(
                keyword,
                location
            );


          res.render("companies", {
    companies,
    keyword,
    location,
    view: req.query.view || "preview"
});


    } catch (error) {

        console.error(
            "Companies API error:",
            error
        );

        res.status(500).send(
            "Unable to fetch companies right now."
        );

    }

});
// CONTACT
router.get("/contact", (req, res) => {
    res.render("contact");
});
router.post("/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).send("All fields are required.");
        }

        await pool.query(
            `
            INSERT INTO contact_messages
            (name, email, subject, message)
            VALUES ($1, $2, $3, $4)
            `,
            [name, email, subject, message]
        );

        res.send(`
            <script>
                alert("Your message has been sent successfully!");
                window.location.href = "/contact";
            </script>
        `);

    } catch (error) {
        console.error("Contact form error:", error);
        res.status(500).send("Unable to send your message right now.");
    }
});


module.exports = router;