import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Page from '../dashboard/invoices/page';

test('renders main elements on the page', async () => {
  render(<Page />);

  // Verificar la existencia de elementos importantes en la página
  expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Collected/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Pending/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Total Invoices/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Total Customers/i })).toBeInTheDocument();
});



test('fetches and displays data from an API', async () => {
  render(<Page />);

  // Esperar a que se complete la carga de datos asincrónicos
  await waitFor(() => {
    expect(screen.getByText(/Fetched data/i)).toBeInTheDocument();
  });
});

