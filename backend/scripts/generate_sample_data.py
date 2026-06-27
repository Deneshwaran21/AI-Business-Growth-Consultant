import pandas as pd
import numpy as np
from datetime import datetime, timedelta

np.random.seed(42)
n_customers = 2000

# Generate features
customer_ids = [f"CUST_{i:05d}" for i in range(1, n_customers+1)]
tenure = np.random.randint(1, 72, n_customers)
monthly_charges = np.round(np.random.uniform(20, 150, n_customers), 2)
total_charges = np.round(monthly_charges * tenure * np.random.uniform(0.8, 1.2, n_customers), 2)
contract = np.random.choice(['Month-to-month', 'One year', 'Two year'], n_customers, p=[0.5, 0.3, 0.2])
payment = np.random.choice(['Electronic check', 'Mailed check', 'Bank transfer', 'Credit card'], n_customers)
age = np.random.randint(18, 70, n_customers)
avg_monthly_spend = np.round(np.random.uniform(50, 500, n_customers), 2)

# Generate churn (synthetic logic to make it realistic)
churn_prob = (
    0.1 * (tenure / 72) 
    + 0.3 * (monthly_charges / 150) 
    - 0.2 * (contract == 'Two year') 
    - 0.1 * (contract == 'One year')
    + 0.05 * (payment == 'Electronic check')
)
churn_prob = np.clip(churn_prob + np.random.normal(0, 0.05, n_customers), 0, 1)
churn = (churn_prob > 0.5).astype(int)

# Generate monthly revenue (regression target)
monthly_revenue = np.round(avg_monthly_spend * np.random.uniform(0.8, 1.5, n_customers), 2)

df = pd.DataFrame({
    'customer_id': customer_ids,
    'tenure': tenure,
    'monthly_charges': monthly_charges,
    'total_charges': total_charges,
    'contract_type': contract,
    'payment_method': payment,
    'age': age,
    'avg_monthly_spend': avg_monthly_spend,
    'churn': churn,
    'monthly_revenue': monthly_revenue
})

df.to_csv('sample_data.csv', index=False)
print("✅ sample_data.csv created with 2000 rows.")