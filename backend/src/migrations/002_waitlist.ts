import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('waitlist', (t) => {
    t.increments('id').primary();
    t.string('email', 255).notNullable().unique();
    t.string('variant', 10).notNullable().defaultTo('A');
    t.string('source', 255);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index('email');
    t.index('variant');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('waitlist');
}
