import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Runtime Mock toggle via Header X-MOCK-MODE
app.use((req, res, next) => {
  const flag = req.header("X-MOCK-MODE");
  if (flag === "true") req.useMock = true;
  else if (flag === "false") req.useMock = false;
  next();
});

// ✅ Determine mode: Mock if env var set OR missing API key
const USE_MOCK =
  process.env.USE_MOCK_MODE === "true" ||
  !process.env.OPENAI_API_KEY;

console.log("🚦 Prediction Mode:", USE_MOCK ? "MOCK" : "OPENAI AI");

// Load OpenAI only when needed
let openai = null;
if (!USE_MOCK) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

app.post("/api/predict", async (req, res) => {
  try {
    const {
      age,
      weightKg,
      heightCm,
      bloodPressure,
      cholesterol,
      gender,
      hba1cPercent,
      glucoseMgDl,
    } = req.body;

    if ([age, weightKg, heightCm, hba1cPercent, glucoseMgDl].some(v =>
      v === undefined || v === null || v === ""
    )) {
      return res.status(400).json({ error: "Nedostaju obavezna polja." });
    }

    const heightM = Number(heightCm) / 100;
    const bmi = Number(weightKg) / (heightM * heightM);

    const userPayload = {
      age,
      weightKg,
      heightCm,
      bmi: Number.isFinite(bmi) ? Number(bmi.toFixed(1)) : null,
      bloodPressure,
      cholesterol,
      gender,
      hba1cPercent,
      glucoseMgDl,
    };

    // ✅ MOCK RESPONSE — default mode
    if (USE_MOCK) {
      const randomRisk = Math.floor(Math.random() * 100);

      return res.json({
        input: userPayload,
        mode: "mock",
        result: {
          risk_percent: randomRisk,
          risk_level:
            randomRisk < 20 ? "low" :
            randomRisk < 50 ? "moderate" :
            randomRisk < 80 ? "high" : "very_high",
          key_factors: [
            "MOCK MODE: Risk estimated without AI",
            "Glucose level used as main factor",
            "BMI and age considered lightly"
          ],
          diet_recommendations: [
            "Increase fresh vegetables",
            "Limit sugary foods & drinks",
            "Choose whole grains (brown rice, oats, barley)"
          ],
          activity_plan: [
            { name: "Walking", frequency_per_week: 3, duration_minutes: 30 },
            { name: "Cycling", frequency_per_week: 2, duration_minutes: 40 },
            { name: "Stretching", frequency_per_week: 3, duration_minutes: 10 }
          ],
          disclaimer: "⚠️ Mock prediction — real AI mode activates when OpenAI credits are available."
        }
      });
    }

    // ✅ REAL AI MODE (future use)
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `Calculate diabetes risk based on: ${JSON.stringify(userPayload)}`
    });

    const out = response.output?.[0]?.content?.[0]?.text;
    const safe = typeof out === "string" ? JSON.parse(out) : out;

    return res.json({
      input: userPayload,
      result: safe,
      mode: "ai"
    });

  } catch (err) {
    console.error("❌ API Greška:", err);
    return res.status(500).json({
      error: "Greška u predikciji.",
      details: err?.message || ""
    });
  }
});

// ✅ Detect port from env (Railway auto injects)
const port = process.env.PORT || 3001;
app.listen(port, () =>
  console.log(`✅ Server running on port ${port}`)
);