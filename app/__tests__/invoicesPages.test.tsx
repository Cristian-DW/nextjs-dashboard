import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Page from '../dashboard/invoices/page';

test('renders dashboard title', async () => {
  render(<Page />);
  const titleElement = screen.getByText(/Dashboard/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders card components with correct values', async () => {
  render(<Page />);
  const collectedCard = screen.getByText(/Collected/i);
  const pendingCard = screen.getByText(/Pending/i);
  const invoicesCard = screen.getByText(/Total Invoices/i);
  const customersCard = screen.getByText(/Total Customers/i);

  expect(collectedCard).toBeInTheDocument();
  expect(pendingCard).toBeInTheDocument();
  expect(invoicesCard).toBeInTheDocument();
  expect(customersCard).toBeInTheDocument();

  // Agrega más aserciones para verificar los valores de las tarjetas
});

test('renders revenue chart and latest invoices', async () => {
  render(<Page />);
  const revenueChart = screen.getByTestId('revenue-chart');
  const latestInvoices = screen.getByTestId('latest-invoices');

  expect(revenueChart).toBeInTheDocument();
  expect(latestInvoices).toBeInTheDocument();

  // Agrega más aserciones para verificar el contenido del gráfico de ingresos y las últimas facturas
});