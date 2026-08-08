require("dotenv").config();
const axios = require("axios");

(async () => {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: "Say hello in JSON.",
          },
        ],
        response_format: {
          type: "json_object",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("SUCCESS");
    console.log(response.data);
  } catch (err) {
    console.log("STATUS:", err.response?.status);
    console.log(err.response?.data || err.message);
  }
})();