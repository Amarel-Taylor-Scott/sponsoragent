import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('channels', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enum('platform_type', [
      'youtube', 'twitch', 'tiktok', 'kick', 'instagram',
      'discord', 'reddit', 'facebook', 'twitter', 'website', 'linktree',
    ]).notNullable();
    t.string('url', 1000).notNullable();
    t.string('name', 255);
    t.jsonb('metadata').defaultTo('{}');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index('user_id');
    t.index('platform_type');
    t.unique(['user_id', 'url']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('channels');
}
