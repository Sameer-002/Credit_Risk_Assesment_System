// Same origin when served by FastAPI. For a separate frontend host, set e.g. "https://your-api.onrender.com"
const API_BASE = "";

const form = document.getElementById("form");
const btn = document.getElementById("go");
const err = document.getElementById("err");
const result = document.getElementById("result");
const arc = document.getElementById("arc");
const needle = document.getElementById("needle");
const thr = document.getElementById("thr");
const probEl = document.getElementById("prob");
const verdict = document.getElementById("verdict");
const thrNote = document.getElementById("thrNote");
const pct = document.getElementById("pct");

const angle = p => -90 + 180 * p;

// Auto-calculate loan_percent_income
function updatePct() {
  const inc = parseFloat(form.person_income.value);
  const amt = parseFloat(form.loan_amnt.value);
  pct.textContent = inc > 0 && amt >= 0 ? (amt / inc).toFixed(2) : "0.00";
}
["person_income", "loan_amnt"].forEach(n => form[n].addEventListener("input", updatePct));
updatePct();

function countUp(el, to, ms = 1600) {
  const t0 = performance.now();
  const tick = now => {
    const k = Math.min((now - t0) / ms, 1);
    el.textContent = (to * (1 - Math.pow(1 - k, 3))).toFixed(1);
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function showError(msg) { err.textContent = msg; err.hidden = false; }

function buildPayload() {
  const fd = new FormData(form);
  const num = k => parseFloat(fd.get(k));
  const income = num("person_income"), amt = num("loan_amnt");
  return {
    person_age: parseInt(fd.get("person_age"), 10),
    person_income: income,
    person_home_ownership: fd.get("person_home_ownership"),
    person_emp_length: num("person_emp_length"),
    loan_intent: fd.get("loan_intent"),
    loan_grade: fd.get("loan_grade"),
    loan_amnt: amt,
    loan_int_rate: num("loan_int_rate"),
    loan_percent_income: +(amt / income).toFixed(4),
    cb_person_default_on_file: fd.get("cb_person_default_on_file"),
    cb_person_cred_hist_length: parseInt(fd.get("cb_person_cred_hist_length"), 10),
  };
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  err.hidden = true;

  // simple validation
  let bad = false;
  form.querySelectorAll("input[type=number]").forEach(i => {
    i.classList.remove("bad");
    if (i.value === "" || isNaN(i.value) || (i.min && +i.value < +i.min)) { i.classList.add("bad"); bad = true; }
  });
  if (bad) return showError("Check the highlighted fields and try again.");

  btn.disabled = true; btn.classList.add("loading");
  // reset dial so the sweep replays
  result.dataset.state = "idle";
  arc.style.transition = needle.style.transition = "none";
  arc.style.strokeDashoffset = 100; needle.style.transform = `rotate(-90deg)`;
  void arc.getBoundingClientRect();
  arc.style.transition = needle.style.transition = "";

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });
    if (!res.ok) throw new Error(res.status === 422 ? "The server rejected one of the values. Check your inputs." : `Server error (${res.status}). Try again.`);
    const d = await res.json();

    const p = d.default_probability, t = d.threshold;
    arc.style.strokeDashoffset = 100 - p * 100;
    needle.style.transform = `rotate(${angle(p)}deg)`;
    thr.style.transform = `rotate(${angle(t)}deg)`;
    thr.style.opacity = 1;
    countUp(probEl, p * 100);

    setTimeout(() => {
      const high = d.default_prediction === 1;
      result.dataset.state = high ? "high" : "low";
      verdict.textContent = d.Result;
      thrNote.textContent = `Dashed mark = decision threshold (${(t * 100).toFixed(1)}%). Above it is high risk.`;
    }, 1300);
  } catch (ex) {
    showError(ex.message.includes("fetch") ? "Can't reach the server. Check your connection and try again." : ex.message);
  } finally {
    btn.disabled = false; btn.classList.remove("loading");
  }
});
