import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('name', 255).notNullable();
    t.string('email', 255).notNullable().unique();
    t.string('password', 255).notNullable();
    t.boolean('email_verified').notNullable().defaultTo(false);
    t.string('verification_token', 255);
    t.boolean('onboarding_completed').notNullable().defaultTo(false);
    t.enum('subscription_plan', ['free', 'pro', 'premium']).notNullable().defaultTo('free');
    t.string('subscription_status', 50).defaultTo('active');
    t.string('subscription_id', 255);
    t.timestamp('subscription_started_at');
    t.string('source', 255);
    t.boolean('terms_accepted').notNullable().defaultTo(false);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index('email');
    t.index('subscription_plan');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
