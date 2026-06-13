import 'server-only';
import { Pool, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function sql<O extends QueryResultRow = any>(
    strings: TemplateStringsArray,
    ...values: any[]
): Promise<QueryResult<O>> {
    const query = strings.reduce((acc, str, i) => {
        return acc + str + (i < values.length ? `$${i + 1}` : '');
    }, '');

    try {
        const result = values.length > 0 
            ? await pool.query<O>(query, values)
            : await pool.query<O>(query);
        return result;
    } catch (error) {
        console.error('Database Error:', error);
        throw error;
    }
}
