const bcrypt = require("bcrypt");
const pool = require("../middleware/config/db");

// REGISTER
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).send("All fields are required.");
        }

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).send("An account with this email already exists.");
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await pool.query(
            `INSERT INTO users (name, email, password_hash, role)
             VALUES ($1, $2, $3, $4)`,
            [name, email, passwordHash, role]
        );

        res.send("Account created successfully! 🎉");

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).send("Something went wrong.");
    }
};


// LOGIN
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send("Email and password are required.");
        }

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).send("Invalid email or password.");
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).send("Invalid email or password.");
        }

        // Create login session
        req.session.userId = user.id;
        req.session.userName = user.name;
        req.session.userRole = user.role;

        if (user.role === "job_seeker") {
    return res.redirect("/dashboard");
}

if (user.role === "recruiter") {
    return res.redirect("/recruiter/dashboard");
}

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send("Something went wrong.");
    }
};


// EXPORT ONLY AFTER BOTH FUNCTIONS ARE CREATED
module.exports = {
    registerUser,
    loginUser
};