import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('brand_outreach', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('brand_name', 255).notNullable();
    t.enum('status', ['draft', 'sent', 'replied', 'negotiating', 'closed', 'rejected']).notNullable().defaultTo('draft');
    t.decimal('deal_value', 10, 2);
    t.text('notes');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.index('user_id');
    t.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('brand_outreach');
}
