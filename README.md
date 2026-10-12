# Credit Risk Check

A machine learning web app that predicts whether a loan applicant is likely to default. Enter an application's details, and the app returns a default probability, a Low Risk or High Risk verdict, and an animated gauge showing where the result sits against the decision threshold.

The model is an XGBoost classifier with calibrated probabilities. It is served by a FastAPI backend, and the interface is plain HTML, CSS and JavaScript.

<!-- Add a screenshot: ![App screenshot](docs/screenshot.png) -->

## Features

- Predicts default probability from 11 applicant and loan inputs
- Calibrated probabilities, so the percentage shown is meaningful
- Tuned decision threshold instead of a fixed 0.5
- Animated gauge, count-up result and clear Low Risk / High Risk verdict
- Loan-to-income ratio calculated automatically in the form
- Input validation on both the front end (JavaScript) and the back end (Pydantic)
- Responsive layout that works on mobile
- Single deployment: FastAPI serves both the API and the web page

## Tech stack

| Layer | Tools |
|---|---|
| Model | Python, scikit-learn, XGBoost, pandas, NumPy |
| Explainability | SHAP (in the notebook) |
| API | FastAPI, Pydantic, Uvicorn |
| Front end | HTML, CSS, vanilla JavaScript |
| Hosting | Render |

## Project structure

```
├── main.py                  # FastAPI app: /predict endpoint and static file serving
├── credit_risk_model.pkl    # Trained, calibrated XGBoost pipeline
├── best_threshold.pkl       # Tuned decision threshold
├── requirements.txt
├── runtime.txt              # Python version for Render
├── Credit_Risk.ipynb        # Data exploration, training, tuning and evaluation
└── static/
    ├── index.html
    ├── style.css
    └── script.js
```

## How the model was built

The full workflow is in `Credit_Risk.ipynb`.

1. **Data:** the Credit Risk Dataset (loan applications with a `loan_status` default label).
2. **Cleaning:** removed duplicates and impossible values (age outside 18 to 100, employment length above 60 years or above age).
3. **Split:** 80/20 stratified train/test split.
4. **Preprocessing:** median imputation for numeric features and constant imputation with one-hot encoding for categorical features, wrapped in a scikit-learn `ColumnTransformer` pipeline.
5. **Class imbalance:** about 22% of loans are defaults, handled with `scale_pos_weight` for XGBoost and `class_weight='balanced'` for the other models.
6. **Models compared:** Logistic Regression, XGBoost, Random Forest and AdaBoost, with 5-fold cross-validation and randomized hyperparameter search.
7. **Calibration:** the tuned XGBoost model is wrapped in `CalibratedClassifierCV` (sigmoid).
8. **Threshold:** the decision threshold is chosen by maximizing F1 on out-of-fold training predictions.
9. **Explainability:** SHAP summary and waterfall plots show which features drive predictions.

### Results

Tuned XGBoost on the held-out test set (before calibration):

| Metric | Value |
|---|---|
| Accuracy | 0.92 |
| Precision (default class) | 0.81 |
| Recall (default class) | 0.81 |
| F1 (default class) | 0.81 |

Cross-validated ROC-AUC for XGBoost was about 0.94, against 0.87 for logistic regression.

<!-- TODO: replace with the final calibrated model's test metrics at the saved threshold. -->

## Input features

| Field | Description |
|---|---|
| `person_age` | Applicant age in years |
| `person_income` | Annual income |
| `person_home_ownership` | `RENT`, `OWN`, `MORTGAGE` or `OTHER` |
| `person_emp_length` | Years of employment |
| `loan_intent` | `PERSONAL`, `EDUCATION`, `MEDICAL`, `VENTURE`, `HOMEIMPROVEMENT` or `DEBTCONSOLIDATION` |
| `loan_grade` | Loan grade, `A` (best) to `G` |
| `loan_amnt` | Loan amount |
| `loan_int_rate` | Interest rate in percent |
| `loan_percent_income` | Loan amount divided by income (calculated by the UI) |
| `cb_person_default_on_file` | Previous default on file, `Y` or `N` |
| `cb_person_cred_hist_length` | Credit history length in years |

