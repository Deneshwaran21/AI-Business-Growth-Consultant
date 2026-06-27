import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components (required for react-chartjs-2 v5+)
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Charts = ({ predictions, probabilities }) => {
  if (!predictions || predictions.length === 0) {
    return <p>No prediction data to display.</p>;
  }

  const data = {
    labels: predictions.map((_, index) => `Customer ${index + 1}`),
    datasets: [
      {
        label: 'Churn Probability',
        data: probabilities,
        backgroundColor: probabilities.map((p) =>
          p > 0.6 ? 'rgba(255, 99, 132, 0.6)' : 'rgba(54, 162, 235, 0.6)'
        ),
        borderColor: probabilities.map((p) =>
          p > 0.6 ? 'rgb(255, 99, 132)' : 'rgb(54, 162, 235)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Churn Risk by Customer',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          callback: (value) => `${(value * 100).toFixed(0)}%`,
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default Charts;