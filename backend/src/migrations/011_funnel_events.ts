import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('funnel_events', (t) => {
    t.increments('id').primary();
    t.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    t.string('email', 255);
    t.string('event_type', 100).notNullable();
    t.jsonb('metadata').defaultTo('{}');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index('user_id');
    t.index('email');
    t.index('event_type');
    t.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('funnel_events');
}
