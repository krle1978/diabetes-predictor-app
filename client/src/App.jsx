import { useState } from "react";
import "./App.css";
import "./styles/ui.css";

export default function App() {
  const [form, setForm] = useState({
    age: "",
    weightKg: "",
    heightCm: "",
    bloodPressure: "",
    cholesterol: "",
    gender: "male",
    hba1cPercent: "",
    glucoseMgDl: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(
        "https://diabetes-predictor-app-production.up.railway.app/api/predict",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            age: Number(form.age),
            weightKg: Number(form.weightKg),
            heightCm: Number(form.heightCm),
            bloodPressure: form.bloodPressure,
            cholesterol: form.cholesterol,
            gender: form.gender,
            hba1cPercent: Number(form.hba1cPercent),
            glucoseMgDl: Number(form.glucoseMgDl),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Diabetes Predictor (demo)</h1>
      <p className="subtitle">
        Personalized diabetes risk assessment powered by AI
      </p>

      <form onSubmit={onSubmit} className="grid">
        <label>Age (years)
          <input name="age" type="number" min="0" step="1" required value={form.age} onChange={onChange} />
        </label>

        <label>Weight (kg)
          <input name="weightKg" type="number" min="1" step="0.1" required value={form.weightKg} onChange={onChange} />
        </label>

        <label>Height (cm)
          <input name="heightCm" type="number" min="30" step="0.1" required value={form.heightCm} onChange={onChange} />
        </label>

        <label>Blood Pressure
          <input name="bloodPressure" placeholder="npr. 130/85" value={form.bloodPressure} onChange={onChange} />
        </label>

        <label>Cholesterol
          <input name="cholesterol" placeholder="npr. 5.2 mmol/L ili 200 mg/dL" value={form.cholesterol} onChange={onChange} />
        </label>

        <label>Gender
          <select name="gender" value={form.gender} onChange={onChange}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other / Prefer not to say</option>
          </select>
        </label>

        <label>HbA1c level (%)
          <input name="hba1cPercent" type="number" min="3" max="20" step="0.1" required value={form.hba1cPercent} onChange={onChange} />
        </label>

        <label>Blood Glucose (mg/dL)
          <input name="glucoseMgDl" type="number" min="40" max="600" step="1" required value={form.glucoseMgDl} onChange={onChange} />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Predicting..." : "Predict"}
        </button>
      </form>

      {error && <p className="error">⚠️ {error}</p>}

      {result && (
        <>
          {result.mode === "mock" && (
            <p className="badge mock">
              ⚠️ Mock Mode Active — AI disabled until credits restored
            </p>
          )}
          {result.mode === "ai" && (
            <p className="badge ai">✅ AI Mode Enabled</p>
          )}

          <div className={`result-card risk-${result.result.risk_level}`} role="alert">
            {/* Risk Gauge */}
            <div className="risk-gauge">
              {result.result.risk_percent}%
            </div>

            <h2 style={{ textTransform: "capitalize" }}>
              Risk: {result.result.risk_level.replace("_", " ")}
            </h2>

            <h3>Key Factors</h3>
            <ul>
              {result.result.key_factors.map((k, i) => <li key={i}>{k}</li>)}
            </ul>

            <h3>Diet recommendations</h3>
            <ul>
              {result.result.diet_recommendations.map((d, i) => <li key={i}>{d}</li>)}
            </ul>

            <h3>Activity Plan</h3>
            <ul>
              {result.result.activity_plan.map((a, i) => (
                <li key={i}>
                  {a.name} — {a.frequency_per_week}× weekly, {a.duration_minutes} min
                </li>
              ))}
            </ul>

            <p className="disclaimer">{result.result.disclaimer}</p>
          </div>
        </>
      )}

      <footer className="tiny">
        * Ova procena je informativna i ne predstavlja medicinsku dijagnozu.
      </footer>
    </div>
  );
}
