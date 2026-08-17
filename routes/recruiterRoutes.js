const express = require("express");
const pool = require("../middleware/config/db");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();


// =========================
// POST JOB PAGE
// =========================

router.get(
    "/recruiter/jobs/new",
    requireRole("recruiter"),
    (req, res) => {
        res.render("postJob");
    }
);


// =========================
// CREATE JOB
// =========================

router.post(
    "/recruiter/post-job",
    requireRole("recruiter"),
    async (req, res) => {

        try {

            const {
                title,
                description,
                location,
                job_type,
                category,
                salary_min,
                salary_max
            } = req.body;

            const recruiterId = req.session.userId;


            const companyResult = await pool.query(
                `SELECT id
                 FROM companies
                 WHERE owner_id = $1
                 LIMIT 1`,
                [recruiterId]
            );


            if (companyResult.rows.length === 0) {

                return res.status(400).send(
                    "You need to create a company profile before posting a job."
                );

            }


            const companyId =
                companyResult.rows[0].id;


            await pool.query(
                `INSERT INTO jobs
                (
                    company_id,
                    title,
                    description,
                    location,
                    job_type,
                    category,
                    salary_min,
                    salary_max
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    companyId,
                    title,
                    description,
                    location,
                    job_type,
                    category,
                    salary_min || null,
                    salary_max || null
                ]
            );


            res.redirect("/recruiter/dashboard");


        } catch (error) {

            console.error(
                "Post job error:",
                error
            );

            res.status(500).send(
                "Unable to post job."
            );

        }

    }
);


// =========================
// VIEW JOB
// =========================

router.get(
    "/recruiter/jobs/:id",
    requireRole("recruiter"),
    async (req, res) => {

        try {

            const recruiterId =
                req.session.userId;

            const jobId =
                req.params.id;


            const result = await pool.query(
                `SELECT
                    jobs.*,
                    companies.name AS company_name,
                    companies.website AS company_website,
                    companies.location AS company_location
                 FROM jobs
                 JOIN companies
                    ON jobs.company_id = companies.id
                 WHERE jobs.id = $1
                 AND companies.owner_id = $2`,
                [jobId, recruiterId]
            );


            if (result.rows.length === 0) {

                return res.status(404).send(
                    "Job not found."
                );

            }


            res.render("recruiterJobDetails", {
                job: result.rows[0]
            });


        } catch (error) {

            console.error(
                "View job error:",
                error
            );

            res.status(500).send(
                "Something went wrong."
            );

        }

    }
);


// =========================
// EDIT JOB PAGE
// =========================

router.get(
    "/recruiter/jobs/:id/edit",
    requireRole("recruiter"),
    async (req, res) => {

        try {

            const recruiterId =
                req.session.userId;

            const jobId =
                req.params.id;


            const result = await pool.query(
                `SELECT
                    jobs.*,
                    companies.name AS company_name
                 FROM jobs
                 JOIN companies
                    ON jobs.company_id = companies.id
                 WHERE jobs.id = $1
                 AND companies.owner_id = $2`,
                [jobId, recruiterId]
            );


            if (result.rows.length === 0) {

                return res.status(404).send(
                    "Job not found."
                );

            }


            res.render("editJob", {
                job: result.rows[0]
            });


        } catch (error) {

            console.error(
                "Edit job page error:",
                error
            );

            res.status(500).send(
                "Something went wrong."
            );

        }

    }
);


// =========================
// UPDATE JOB
// =========================

router.post(
    "/recruiter/jobs/:id/edit",
    requireRole("recruiter"),
    async (req, res) => {

        try {

            const recruiterId =
                req.session.userId;

            const jobId =
                req.params.id;


            const {
                title,
                description,
                location,
                job_type,
                category,
                salary_min,
                salary_max
            } = req.body;


            const result = await pool.query(
                `UPDATE jobs
                 SET
                    title = $1,
                    description = $2,
                    location = $3,
                    job_type = $4,
                    category = $5,
                    salary_min = $6,
                    salary_max = $7
                 WHERE id = $8
                 AND company_id IN (
                    SELECT id
                    FROM companies
                    WHERE owner_id = $9
                 )
                 RETURNING id`,
                [
                    title,
                    description,
                    location,
                    job_type,
                    category,
                    salary_min || null,
                    salary_max || null,
                    jobId,
                    recruiterId
                ]
            );


            if (result.rows.length === 0) {

                return res.status(404).send(
                    "Job not found."
                );

            }


            res.redirect(
                `/recruiter/jobs/${jobId}`
            );


        } catch (error) {

            console.error(
                "Update job error:",
                error
            );

            res.status(500).send(
                "Unable to update job."
            );

        }

    }
);


// =========================
// DELETE JOB
// =========================

router.post(
    "/recruiter/jobs/:id/delete",
    requireRole("recruiter"),
    async (req, res) => {

        try {

            const recruiterId =
                req.session.userId;

            const jobId =
                req.params.id;


            const result = await pool.query(
                `DELETE FROM jobs
                 WHERE id = $1
                 AND company_id IN (
                    SELECT id
                    FROM companies
                    WHERE owner_id = $2
                 )
                 RETURNING id`,
                [jobId, recruiterId]
            );


            if (result.rows.length === 0) {

                return res.status(404).send(
                    "Job not found."
                );

            }


            res.redirect(
                "/recruiter/dashboard"
            );


        } catch (error) {

            console.error(
                "Delete job error:",
                error
            );

            res.status(500).send(
                "Unable to delete job."
            );

        }

    }
);


// =========================
// VIEW APPLICANTS
// =========================

router.get(
    "/recruiter/applicants",
    requireRole("recruiter"),
    async (req, res) => {

        try {

            const recruiterId =
                req.session.userId;


            const result = await pool.query(
                `SELECT
                    applications.id,
                    applications.status,
                    applications.applied_at,
                    applications.resume_path,
                    applications.cover_letter,

                    users.name AS applicant_name,
                    users.email AS applicant_email,

                    jobs.id AS job_id,
                    jobs.title AS job_title

                 FROM applications

                 JOIN users
                    ON applications.user_id = users.id

                 JOIN jobs
                    ON applications.job_id = jobs.id

                 JOIN companies
                    ON jobs.company_id = companies.id

                 WHERE companies.owner_id = $1

                 ORDER BY applications.applied_at DESC`,
                [recruiterId]
            );


            res.render("recruiterApplicants", {
                applicants: result.rows
            });


        } catch (error) {

            console.error(
                "Applicants error:",
                error
            );

            res.status(500).send(
                "Unable to load applicants."
            );

        }

    }
);


// =========================
// UPDATE APPLICATION STATUS
// =========================

router.post(
    "/recruiter/applications/:id/status",
    requireRole("recruiter"),
    async (req, res) => {

        try {

            const recruiterId =
                req.session.userId;

            const applicationId =
                req.params.id;

            const { status } =
                req.body;


            const allowedStatuses = [
                "applied",
                "shortlisted",
                "rejected",
                "hired"
            ];


            if (!allowedStatuses.includes(status)) {

                return res.status(400).send(
                    "Invalid application status."
                );

            }


            const result = await pool.query(
                `UPDATE applications
                 SET status = $1
                 WHERE id = $2
                 AND job_id IN (
                    SELECT jobs.id
                    FROM jobs
                    JOIN companies
                        ON jobs.company_id = companies.id
                    WHERE companies.owner_id = $3
                 )
                 RETURNING id`,
                [
                    status,
                    applicationId,
                    recruiterId
                ]
            );


            if (result.rows.length === 0) {

                return res.status(404).send(
                    "Application not found."
                );

            }


            res.redirect(
                "/recruiter/applicants"
            );


        } catch (error) {

            console.error(
                "Application status error:",
                error
            );

            res.status(500).send(
                "Unable to update application."
            );

        }

    }
);


module.exports = router;