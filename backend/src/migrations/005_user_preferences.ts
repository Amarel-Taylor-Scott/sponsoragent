import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_preferences', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE').unique();
    t.jsonb('content_niches').defaultTo('[]');
    t.jsonb('brand_exclusions').defaultTo('[]');
    t.integer('min_deal_value').defaultTo(100);
    t.jsonb('communication_preferences').defaultTo('{}');
    t.string('outreach_style', 50).defaultTo('professional');
    t.boolean('dry_run_mode').notNullable().defaultTo(false);
    t.jsonb('notification_preferences').defaultTo('{"email":true,"browser":true}');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_preferences');
}
