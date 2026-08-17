const express = require("express");
const pool = require("../middleware/config/db");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();
router.get(
    "/recruiter/dashboard",
    requireRole("recruiter"),
    async (req, res) => {
        try {
            const recruiterId = req.session.userId;

            // Get recruiter information
            const userResult = await pool.query(
                `SELECT id, name, email, role
                 FROM users
                 WHERE id = $1`,
                [recruiterId]
            );

            if (userResult.rows.length === 0) {
                return res.redirect("/login");
            }

            const user = userResult.rows[0];

            // Get recruiter's jobs
            const jobsResult = await pool.query(
                `SELECT
                    jobs.id,
                    jobs.title,
                    jobs.location,
                    jobs.job_type,
                    jobs.category,
                    jobs.salary_min,
                    jobs.salary_max,
                    jobs.created_at,
                    companies.name AS company_name
                 FROM jobs
                 JOIN companies
                    ON jobs.company_id = companies.id
                 WHERE companies.owner_id = $1
                 ORDER BY jobs.created_at DESC`,
                [recruiterId]
            );

            // Count active jobs
            const activeJobsResult = await pool.query(
                `SELECT COUNT(*) AS count
                 FROM jobs
                 JOIN companies
                    ON jobs.company_id = companies.id
                 WHERE companies.owner_id = $1`,
                [recruiterId]
            );

            // Count applications received
            const applicationsResult = await pool.query(
                `SELECT COUNT(*) AS count
                 FROM applications
                 JOIN jobs
                    ON applications.job_id = jobs.id
                 JOIN companies
                    ON jobs.company_id = companies.id
                 WHERE companies.owner_id = $1`,
                [recruiterId]
            );

            const activeJobs = Number(activeJobsResult.rows[0].count);
            const applications = Number(applicationsResult.rows[0].count);

            res.render("recruiterDashboard", {
                user,
                jobs: jobsResult.rows,
                activeJobs,
                applications
            });

        } catch (error) {
            console.error("Recruiter dashboard error:", error);
            res.status(500).send("Something went wrong.");
        }
    }
);

module.exports = router;