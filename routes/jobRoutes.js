const express = require("express");
const multer = require("multer");

const { getJobs } = require("../services/jobService");
const pool = require("../middleware/config/db");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();


// =========================
// RESUME UPLOAD CONFIG
// =========================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            ".pdf";

        cb(null, uniqueName);
    }

});

const upload = multer({
    storage: storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF resumes are allowed."));
        }

    }
});


// =========================
// EXTERNAL API JOBS
// =========================




// =========================
// EXTERNAL JOB DETAILS
// =========================

router.get("/jobs/details", (req, res) => {

    const job = {

        title: req.query.title,

        company: req.query.company,

        location: req.query.location,

        description: req.query.description,

        salaryMin: req.query.salaryMin,

        salaryMax: req.query.salaryMax,

        redirectUrl: req.query.redirectUrl

    };

    res.render("jobDetails", {
        job
    });

});


// =========================
// JOBVERSE JOB DETAILS
// =========================

router.get("/jobs", async (req, res) => {

    try {

        const keyword =
            req.query.keyword || "software developer";

        const location =
            req.query.location || "india";

        const jobType =
            req.query.jobType || "";

        const category =
            req.query.category || "";


        const jobs = await getJobs(
            keyword,
            location,
            jobType,
            category
        );


        res.render("jobs", {

            jobs,

            keyword,

            location,

            jobType,

            category

        });


    } catch (error) {

        console.error(
            "Jobs API error:",
            error
        );

        res.status(500).send(
            "Unable to fetch jobs right now."
        );

    }

});

// =========================
// APPLICATION FORM
// =========================

router.get(
    "/jobs/:id/apply",
    requireRole("job_seeker"),
    async (req, res) => {

        try {

            const jobId =
                req.params.id;


            const result = await pool.query(

                `SELECT
                    jobs.id,
                    jobs.title,
                    jobs.location,
                    companies.name AS company_name
                 FROM jobs
                 JOIN companies
                    ON jobs.company_id = companies.id
                 WHERE jobs.id = $1`,

                [jobId]

            );


            if (result.rows.length === 0) {

                return res.status(404).send(
                    "Job not found."
                );

            }


            // Check if already applied

            const existingApplication =
                await pool.query(

                    `SELECT id
                     FROM applications
                     WHERE job_id = $1
                     AND user_id = $2`,

                    [
                        jobId,
                        req.session.userId
                    ]

                );


            if (
                existingApplication.rows.length > 0
            ) {

                return res.status(400).send(
                    "You have already applied for this job."
                );

            }


            res.render("apply", {
                job: result.rows[0]
            });


        } catch (error) {

            console.error(
                "Application form error:",
                error
            );

            res.status(500).send(
                "Unable to load application form."
            );

        }

    }
);


// =========================
// SUBMIT APPLICATION
// =========================

router.post(
    "/jobs/:id/apply",
    requireRole("job_seeker"),
    upload.single("resume"),

    async (req, res) => {

        try {

            const jobId =
                req.params.id;

            const userId =
                req.session.userId;

            const coverLetter =
                req.body.cover_letter || null;


            // Make sure a resume was uploaded

            if (!req.file) {

                return res.status(400).send(
                    "Please upload your resume in PDF format."
                );

            }


            // Check job exists

            const jobResult =
                await pool.query(

                    `SELECT id
                     FROM jobs
                     WHERE id = $1`,

                    [jobId]

                );


            if (jobResult.rows.length === 0) {

                return res.status(404).send(
                    "Job not found."
                );

            }


            // Check duplicate application

            const existingApplication =
                await pool.query(

                    `SELECT id
                     FROM applications
                     WHERE job_id = $1
                     AND user_id = $2`,

                    [
                        jobId,
                        userId
                    ]

                );


            if (
                existingApplication.rows.length > 0
            ) {

                return res.status(400).send(
                    "You have already applied for this job."
                );

            }


            // Save application

            await pool.query(

                `INSERT INTO applications
                (
                    job_id,
                    user_id,
                    status,
                    resume_path,
                    cover_letter
                )
                VALUES
                ($1, $2, 'applied', $3, $4)`,

                [
                    jobId,
                    userId,
                    req.file.path,
                    coverLetter
                ]

            );


            res.redirect(
                `/jobs/${jobId}?applied=true`
            );


        } catch (error) {

            console.error(
                "Application error:",
                error
            );

            res.status(500).send(
                "Unable to submit application."
            );

        }

    }
);


module.exports = router;