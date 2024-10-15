const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

// Endpoint to get the result by roll and regno
app.get('/result', async (req, res) => {
    const { roll, regno } = req.query;

    // Check if roll and regno parameters are provided
    if (!roll || !regno) {
        return res.status(400).json({
            error: "Missing roll or regno parameter.",
            api_owner: "@PikaApis"
        });
    }

    try {
        // URL to send POST request
        const url = "https://www.jessoreboard.gov.bd/resultjbh24/result.php";

        // Data to send in the POST request
        const data = `roll=${roll}&regno=${regno}`;

        // Send POST request using axios
        const response = await axios.post(url, data, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        // Load the HTML response into cheerio for parsing
        const $ = cheerio.load(response.data);

        // Extract student info
        const student_info = {};
        const table_info = $('table.table_info');
        student_info.roll = table_info.find('tr').eq(0).find('td').eq(1).text();
        student_info.name = table_info.find('tr').eq(0).find('td').eq(3).text();
        student_info.father_name = table_info.find('tr').eq(1).find('td').eq(3).text();
        student_info.mother_name = table_info.find('tr').eq(2).find('td').eq(3).text();
        student_info.group = table_info.find('tr').eq(2).find('td').eq(1).text();
        student_info.gpa = table_info.find('tr').eq(5).find('td').eq(1).text();

        // Extract grade sheet
        const grades = [];
        const table_result = $('table.table_result');
        table_result.find('tr').slice(1).each((i, elem) => { // Skip header
            const subject = $(elem).find('td').eq(0).text().trim();
            const total_marks = $(elem).find('td').eq(1).text().trim();
            const grade = $(elem).find('td').eq(2).text().trim();
            grades.push({ subject, total_marks, grade });
        });

        // Create the final result object including api_owner
        const result = {
            api_owner: "@PikaApis",
            student_info,
            grade_sheet: grades
        };

        // Return the JSON response
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Error fetching the result.",
            api_owner: "@PikaApis"
        });
    }
});

// Export the app for Vercel's serverless function
module.exports = app;
