import { render, screen } from '@testing-library/react';
import Page from '../page';

test('renders the welcome message', () => {
  render(<Page />);
  const welcomeMessage = screen.getByText(/Bienvenido a Acme./i);
  expect(welcomeMessage).toBeInTheDocument();
});

test('renders the login link', () => {
  render(<Page />);
  const loginLink = screen.getByRole('link', { name: /log in/i });
  expect(loginLink).toBeInTheDocument();
});

test('renders the desktop hero image', () => {
  render(<Page />);
  const desktopImage = screen.getByAltText(/screenshot of the dashboard/i);
  expect(desktopImage).toBeInTheDocument();
});

test('renders the mobile hero image', () => {
  render(<Page />);
  const mobileImage = screen.getByAltText(/screenshot of the dashboard/i);
  expect(mobileImage).toBeInTheDocument();
});