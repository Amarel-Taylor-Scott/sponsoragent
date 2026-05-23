import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('email_sequences', (t) => {
    t.increments('id').primary();
    t.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    t.string('email', 255);
    t.string('sequence_name', 100).notNullable();
    t.integer('current_step').notNullable().defaultTo(0);
    t.timestamp('next_send_at');
    t.enum('status', ['active', 'completed', 'unsubscribed']).notNullable().defaultTo('active');

    t.index('user_id');
    t.index('email');
    t.index('status');
    t.index('next_send_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('email_sequences');
}
