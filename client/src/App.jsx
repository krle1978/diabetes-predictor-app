import { useState, useEffect } from "react";
import "./App.css";
import "./styles/ui.css";

const API_BASE = "https://diabetes-predictor-app-production.up.railway.app";

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
  const [mockEnabled, setMockEnabled] = useState(true);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "m") {
        setMockEnabled((prev) => !prev);
        alert(
          `Mock Mode: ${!mockEnabled ? "✅ ON" : "❌ OFF"}\n(Re-send predicting)`
        );
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mockEnabled]);

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
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          weightKg: Number(form.weightKg),
          heightCm: Number(form.heightCm),
          hba1cPercent: Number(form.hba1cPercent),
          glucoseMgDl: Number(form.glucoseMgDl),
          mock: mockEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setResult(data.result); // ✅ FIX
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      <div className="container">

        <img
          src="/smarthealth_logo.png"
          alt="SmartHealth AI"
          className="brand-logo"
        />

        <h1>SmartHealth AI — Diabetes Predictor</h1>
        <p className="subtitle">
          Personalized diabetes risk assessment powered by AI
        </p>

        {mockEnabled ? (
          <p className="badge mock">⚠️ MOCK Mode Active</p>
        ) : (
          <p className="badge ai">✅ AI Mode Enabled</p>
        )}

        <form onSubmit={onSubmit} className="grid">
          <label>Age (years)
            <input name="age" type="number" required value={form.age} onChange={onChange} />
          </label>

          <label>Weight (kg)
            <input name="weightKg" type="number" required value={form.weightKg} onChange={onChange} />
          </label>

          <label>Height (cm)
            <input name="heightCm" type="number" required value={form.heightCm} onChange={onChange} />
          </label>

          <label>Blood Pressure
            <input name="bloodPressure" placeholder="130/85" value={form.bloodPressure} onChange={onChange} />
          </label>

          <label>Cholesterol
            <input name="cholesterol" placeholder="5.2 mmol/L or 200 mg/dL" value={form.cholesterol} onChange={onChange} />
          </label>

          <label>Gender
            <select name="gender" value={form.gender} onChange={onChange}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Prefer not to say</option>
            </select>
          </label>

          <label>HbA1c level (%)
            <input name="hba1cPercent" type="number" required
              value={form.hba1cPercent} onChange={onChange} />
          </label>

          <label>Blood Glucose (mg/dL)
            <input name="glucoseMgDl" type="number" required
              value={form.glucoseMgDl} onChange={onChange} />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Predicting..." : "Predict"}
          </button>
        </form>

        {error && <p className="error">⚠️ {error}</p>}

        {result && (
          <div className={`result-card risk-${result.risk_level}`} role="alert">
            <div className="risk-gauge">
              {result.risk_percent}%
            </div>

            <h2 style={{ textTransform: "capitalize" }}>
              Risk: {result.risk_level.replace("_", " ")}
            </h2>

            <h3>Key Factors</h3>
            <ul>
              {result.key_factors.map((k, i) => <li key={i}>{k}</li>)}
            </ul>

            <h3>Diet recommendations</h3>
            <ul>
              {result.diet_recommendations.map((d, i) => <li key={i}>{d}</li>)}
            </ul>

            <h3>Activity Plan</h3>
            <ul>
              {result.activity_plan.map((a, i) => (
                <li key={i}>
                  {a.name} — {a.frequency_per_week}× weekly, {a.duration_minutes} min
                </li>
              ))}
            </ul>

            <p className="disclaimer">{result.disclaimer}</p>
          </div>
        )}

        <footer className="tiny">
          * This assessment is informational and not a medical diagnosis.
        </footer>
      </div>
    </div>
  );
}
