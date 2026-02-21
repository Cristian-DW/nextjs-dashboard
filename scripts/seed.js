const { Client } = require('pg');
const {
  invoices,
  customers,
  revenue,
  users,
} = require('../app/lib/placeholder-data.js');
const bcrypt = require('bcrypt');

async function seedUsers(client) {
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    const createTable = await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);

    console.log(`Created "users" table`);

    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return client.query(
          `INSERT INTO users (id, name, email, password)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [user.id, user.name, user.email, hashedPassword]
        );
      }),
    );

    console.log(`Seeded ${insertedUsers.length} users`);

    return {
      createTable,
      users: insertedUsers,
    };
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

async function seedInvoices(client) {
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    const createTable = await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        customer_id UUID NOT NULL,
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        due_date DATE
      );
    `);

    console.log(`Created "invoices" table`);

    const insertedInvoices = await Promise.all(
      invoices.map((invoice) =>
        client.query(
          `INSERT INTO invoices (customer_id, amount, status, date)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [invoice.customer_id, invoice.amount, invoice.status, invoice.date]
        )
      ),
    );

    console.log(`Seeded ${insertedInvoices.length} invoices`);

    return {
      createTable,
      invoices: insertedInvoices,
    };
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  }
}

async function seedCustomers(client) {
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    const createTable = await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        address TEXT,
        vat_id VARCHAR(50)
      );
    `);

    console.log(`Created "customers" table`);

    const insertedCustomers = await Promise.all(
      customers.map((customer) =>
        client.query(
          `INSERT INTO customers (id, name, email, image_url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [customer.id, customer.name, customer.email, customer.image_url]
        )
      ),
    );

    console.log(`Seeded ${insertedCustomers.length} customers`);

    return {
      createTable,
      customers: insertedCustomers,
    };
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}

async function seedRevenue(client) {
  try {
    const createTable = await client.query(`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      );
    `);

    console.log(`Created "revenue" table`);

    const insertedRevenue = await Promise.all(
      revenue.map((rev) =>
        client.query(
          `INSERT INTO revenue (month, revenue)
           VALUES ($1, $2)
           ON CONFLICT (month) DO NOTHING`,
          [rev.month, rev.revenue]
        )
      ),
    );

    console.log(`Seeded ${insertedRevenue.length} revenue`);

    return {
      createTable,
      revenue: insertedRevenue,
    };
  } catch (error) {
    console.error('Error seeding revenue:', error);
    throw error;
  }
}

async function seedInvoiceItems(client) {
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    const createTable = await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        invoice_id UUID NOT NULL,
        description TEXT NOT NULL,
        quantity INT NOT NULL,
        unit_price INT NOT NULL,
        amount INT NOT NULL
      );
    `);

    console.log(`Created "invoice_items" table`);
    return { createTable };
  } catch (error) {
    console.error('Error seeding invoice_items:', error);
    throw error;
  }
}

async function seedDocuments(client) {
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    const createTable = await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        linked_to_type VARCHAR(50),
        linked_to_id UUID
      );
    `);

    console.log(`Created "documents" table`);
    return { createTable };
  } catch (error) {
    console.error('Error seeding documents:', error);
    throw error;
  }
}

async function main() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });

  await client.connect();

  try {
    await seedUsers(client);
    await seedCustomers(client);
    await seedInvoices(client);
    await seedInvoiceItems(client);
    await seedDocuments(client);
    await seedRevenue(client);

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(
    'An error occurred while attempting to seed the database:',
    err,
  );
});
