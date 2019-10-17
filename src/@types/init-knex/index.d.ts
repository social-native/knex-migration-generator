declare module 'lib/knex/init-knex' {
    import * as Knex from 'knex';
    export function initKnex(env: any, opts: any): Knex;
}
