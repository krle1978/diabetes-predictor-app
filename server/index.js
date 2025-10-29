import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/predict", async (req, res) => {
  try {
    const {
      age,
      weightKg,
      heightCm,
      bloodPressure,     // sistolni/diastolni ili srednja vrednost (string dozvoljen)
      cholesterol,       // mmol/L ili mg/dL (string dozvoljen)
      gender,            // "male" | "female" | "other"
      hba1cPercent,
      glucoseMgDl,
    } = req.body;

    // Minimalna serverska validacija
    if (
      [age, weightKg, heightCm, hba1cPercent, glucoseMgDl].some(
        (v) => v === undefined || v === null || v === ""
      )
    ) {
      return res.status(400).json({ error: "Nedostaju obavezna polja." });
    }

    // Izračunaj BMI (server-side, da damo modelu gotovu metrikу)
    const heightM = Number(heightCm) / 100;
    const bmi = Number(weightKg) / (heightM * heightM);

    // JSON schema za striktno strukturisani izlaz
 const schema = {
  type: "object",
  properties: {
    risk_percent: { type: "number", minimum: 0, maximum: 100 },
    risk_level: { type: "string", enum: ["low", "moderate", "high", "very_high"] },
    key_factors: { type: "array", items: { type: "string" } },
    diet_recommendations: { type: "array", items: { type: "string" } },
    activity_plan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          frequency_per_week: { type: "integer", minimum: 1, maximum: 7 },
          duration_minutes: { type: "integer", minimum: 10, maximum: 120 },
        },
        required: ["name", "frequency_per_week", "duration_minutes"],
        additionalProperties: false,
      },
    },
    disclaimer: { type: "string" },
  },
  required: [
    "risk_percent",
    "risk_level",
    "key_factors", // ✅ dodato!
    "diet_recommendations",
    "activity_plan",
    "disclaimer"
  ],
  additionalProperties: false,
};

    const systemPrompt = `
You are a health-risk estimation assistant. 
Estimate diabetes risk **probabilistically** (0–100%) given vitals.
Use general epidemiological priors and common risk factors, but DO NOT claim diagnostic certainty.
Use BMI (provided), glucose (mg/dL), HbA1c (%), blood pressure, cholesterol, age, sex. 
Explain top 3–6 key factors that most influenced the risk.
Return actionable but safe recommendations for diet (bullet items) and a weekly activity plan (3–5 items).
Always include a short medical disclaimer that this is not diagnosis and users should consult a clinician. 
If inputs are inconsistent, reduce confidence and reflect uncertainty in risk_percent and key_factors.
`;

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

    // Responses API + Structured Outputs
    const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
        { role: "system", content: systemPrompt },
        {
        role: "user",
        content: "Calculate diabetes risk and return structured JSON using the provided schema.",
        },
        {
        role: "user",
        content: `INPUT: ${JSON.stringify(userPayload)}`,
        },
    ],
        text: {
            format: {
            type: "json_schema",
            name: "DiabetesRiskResponse",
            schema, // ✅ najnovija specifikacija
            },
        },
    });

        // Ekstrakcija JSON rezultata iz Responses API
        const out = response.output?.[0]?.content?.[0]?.text;
        // Ako SDK promeni oblik, fallback:
        const safe = typeof out === "string" ? JSON.parse(out) : out;

        return res.json({
        input: userPayload,
        result: safe,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
        error: "Greška u predikciji.",
        details: err?.message,
        });
    }
    });

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`✅ API radi na http://localhost:${port}`));
