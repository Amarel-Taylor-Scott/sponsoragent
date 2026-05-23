import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_sessions', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.timestamp('logged_in_at').notNullable().defaultTo(knex.fn.now());
    t.string('page_visited', 500);
    t.string('action_taken', 255);

    t.index('user_id');
    t.index('logged_in_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_sessions');
}
