import React from 'react';
import { render } from '@testing-library/react';
import Layout from '../dashboard/layout';

test('renders children', () => {
  const { getByText } = render(
    <Layout>
      <div>Child 1</div>
      <div>Child 2</div>
    </Layout>
  );

  expect(getByText('Child 1')).toBeInTheDocument();
  expect(getByText('Child 2')).toBeInTheDocument();
});

test('applies correct CSS classes', () => {
  const { container } = render(<Layout>
    <div>Child 1</div>
    <div>Child 2</div>
  </Layout>);

  expect(container.firstChild).toHaveClass('flex');
  expect(container.firstChild).toHaveClass('h-screen');
  expect(container.firstChild).toHaveClass('flex-col');
  expect(container.firstChild).toHaveClass('md:flex-row');
  expect(container.firstChild).toHaveClass('md:overflow-hidden');
  if (container.firstChild !== null) {
  expect(container.firstChild.firstChild).toHaveClass('w-full');
  expect(container.firstChild.firstChild).toHaveClass('flex-none');
  expect(container.firstChild.firstChild).toHaveClass('md:w-64');
  expect(container.firstChild.lastChild).toHaveClass('flex-grow');
  expect(container.firstChild.lastChild).toHaveClass('p-6');
  expect(container.firstChild.lastChild).toHaveClass('md:overflow-y-auto');
  expect(container.firstChild.lastChild).toHaveClass('md:p-12');
  }
});
