const express = require("express");
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Resume Screener API is running");
});

app.post("/upload", async (req, res) => {
  try {
    if (!req.files || !req.files.resume) {
      return res.status(400).json({ error: "No resume file uploaded" });
    }

    const resumeBuffer = req.files.resume.data;

    let pdfData;
    try {
      pdfData = await pdfParse(resumeBuffer);
    } catch (parseErr) {
      return res.status(400).json({ error: "Failed to parse PDF: " + parseErr.message });
    }

    const prompt = `Analyze this resume and provide a score and feedback:\n\n${pdfData.text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const result = completion.choices[0].message.content;
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: "Failed to process resume: " + error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
