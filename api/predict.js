export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

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
    return res.status(400).json({ error: "Missing fields." });
  }

  const heightM = Number(heightCm) / 100;
  const bmi = Number(weightKg) / (heightM * heightM);

  const randomRisk = Math.floor(Math.random() * 100);

  return res.json({
    mode: "mock",
    input: req.body,
    result: {
      risk_percent: randomRisk,
      risk_level:
        randomRisk < 20 ? "low" :
        randomRisk < 50 ? "moderate" :
        randomRisk < 80 ? "high" : "very_high",
      key_factors: [
        "Mock Mode – AI disabled (no credits)",
        "Glucose major predictor",
        "BMI influencing risk"
      ],
      diet_recommendations: [
        "Increase vegetables",
        "Reduce sugary foods",
        "Use whole grains"
      ],
      activity_plan: [
        { name: "Walking", frequency_per_week: 3, duration_minutes: 30 },
        { name: "Cycling", frequency_per_week: 2, duration_minutes: 45 },
      ],
      disclaimer: "⚠️ Mock prediction only — Not medical diagnosis"
    }
  });
}