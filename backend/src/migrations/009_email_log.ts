import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('email_log', (t) => {
    t.increments('id').primary();
    t.integer('sequence_id').references('id').inTable('email_sequences').onDelete('SET NULL');
    t.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    t.string('email_type', 100).notNullable();
    t.timestamp('sent_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('opened_at');
    t.timestamp('clicked_at');

    t.index('sequence_id');
    t.index('user_id');
    t.index('email_type');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('email_log');
}
