import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('analyses', (t) => {
    t.increments('id').primary();
    t.integer('channel_id').references('id').inTable('channels').onDelete('SET NULL');
    t.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    t.string('platform_type', 50).notNullable();
    t.jsonb('results').notNullable().defaultTo('{}');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index('channel_id');
    t.index('user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('analyses');
}
