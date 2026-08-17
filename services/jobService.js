const https = require("https");


const getJobs = (
    keyword = "software developer",
    location = "india",
    jobType = "",
    category = ""
) => {

    return new Promise((resolve, reject) => {

        const appId = process.env.ADZUNA_APP_ID;
        const appKey = process.env.ADZUNA_APP_KEY;


        let searchKeyword = keyword;


        // Add category to Adzuna search
        if (category) {
            searchKeyword += ` ${category}`;
        }


        const params = new URLSearchParams({

            app_id: appId,

            app_key: appKey,

            results_per_page: "20",

            what: searchKeyword,

            where: location,

            "content-type": "application/json"

        });


        // Add job type when selected
        if (jobType) {

            params.append(
                "full_time",
                jobType === "Full-time" ? "1" : "0"
            );

        }


        const url =
            `https://api.adzuna.com/v1/api/jobs/in/search/1?${params.toString()}`;


        https.get(url, (response) => {

            let data = "";


            response.on("data", (chunk) => {

                data += chunk;

            });


            response.on("end", () => {

                try {

                    if (response.statusCode !== 200) {

                        return reject(
                            new Error(
                                `Adzuna API returned status ${response.statusCode}: ${data}`
                            )
                        );

                    }


                    const result =
                        JSON.parse(data);


                    let jobs =
                        result.results || [];


                    // Additional filtering for job type
                    if (jobType && jobType !== "Full-time") {

                        const searchType =
                            jobType.toLowerCase();


                        jobs = jobs.filter(job => {

                            const title =
                                (job.title || "").toLowerCase();

                            const description =
                                (job.description || "").toLowerCase();


                            return (
                                title.includes(searchType) ||
                                description.includes(searchType)
                            );

                        });

                    }


                    resolve(jobs);


                } catch (error) {

                    reject(error);

                }

            });

        }).on("error", (error) => {

            reject(error);

        });

    });

};

const getTopCompanies = (
    keyword = "software developer",
    location = "india"
) => {

    return new Promise((resolve, reject) => {

        const appId = process.env.ADZUNA_APP_ID;
        const appKey = process.env.ADZUNA_APP_KEY;

        const params = new URLSearchParams({
            app_id: appId,
            app_key: appKey,
            what: keyword,
            where: location,
            "content-type": "application/json"
        });

        const url =
            `https://api.adzuna.com/v1/api/jobs/in/top_companies?${params.toString()}`;

        https.get(url, (response) => {

            let data = "";

            response.on("data", (chunk) => {
                data += chunk;
            });

            response.on("end", () => {

                try {

                    if (response.statusCode !== 200) {

                        return reject(
                            new Error(
                                `Adzuna Top Companies API returned status ${response.statusCode}: ${data}`
                            )
                        );

                    }

                    const result = JSON.parse(data);

                    resolve(result.leaderboard || []);

                } catch (error) {
                    reject(error);
                }

            });

        }).on("error", (error) => {
            reject(error);
        });

    });

};
const getCompaniesFromJobs = (
    keyword = "software developer",
    location = "india"
) => {

    return new Promise((resolve, reject) => {

        const appId = process.env.ADZUNA_APP_ID;
        const appKey = process.env.ADZUNA_APP_KEY;

        const pages = [1, 2, 3];
        const allJobs = [];

        const fetchPage = (pageIndex) => {

            if (pageIndex >= pages.length) {

                // Group jobs by company
                const companyMap = new Map();

                allJobs.forEach(job => {

                    const companyName =
                        job.company?.display_name?.trim();

                    if (!companyName) {
                        return;
                    }

                    if (!companyMap.has(companyName)) {

                        companyMap.set(companyName, {
                            name: companyName,
                            jobCount: 0,
                            locations: new Set(),
                            categories: new Set()
                        });

                    }

                    const company =
                        companyMap.get(companyName);

                    company.jobCount += 1;

                    if (job.location?.display_name) {
                        company.locations.add(
                            job.location.display_name
                        );
                    }

                    if (job.category?.label) {
                        company.categories.add(
                            job.category.label
                        );
                    }

                });


                // Convert Map into array
                const companies =
                    Array.from(companyMap.values())
                        .map(company => ({

                            name: company.name,

                            jobCount: company.jobCount,

                            location:
                                Array.from(company.locations)[0]
                                || "India",

                            category:
                                Array.from(company.categories)[0]
                                || "Various industries"

                        }))
                        .sort(
                            (a, b) =>
                                b.jobCount - a.jobCount
                        );


                return resolve(companies);
            }


            const page = pages[pageIndex];

            const params = new URLSearchParams({

                app_id: appId,

                app_key: appKey,

                results_per_page: "20",

                what: keyword,

                where: location,

                "content-type": "application/json"

            });


            const url =
                `https://api.adzuna.com/v1/api/jobs/in/search/${page}?${params.toString()}`;


            https.get(url, (response) => {

                let data = "";

                response.on("data", chunk => {
                    data += chunk;
                });


                response.on("end", () => {

                    try {

                        if (response.statusCode !== 200) {

                            return reject(
                                new Error(
                                    `Adzuna API returned status ${response.statusCode}`
                                )
                            );

                        }

                        const result =
                            JSON.parse(data);

                        if (result.results) {
                            allJobs.push(
                                ...result.results
                            );
                        }

                        fetchPage(pageIndex + 1);

                    } catch (error) {

                        reject(error);

                    }

                });

            }).on("error", error => {

                reject(error);

            });

        };


        fetchPage(0);

    });

};
module.exports = {
    getJobs,
    getTopCompanies,
    getCompaniesFromJobs
};