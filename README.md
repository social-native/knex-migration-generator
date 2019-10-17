# snpkg-knex-migration-generator

Allow your package to generate migrations that install in a downstream service 

## Install

```
npm install --save @social-native/snpkg-knex-migration-generator
```

## About

This library will give your package the ability to 'install' migrations in a downstream service.

## Usage

### 1. Bin

This library should be used in a `bin` file that your package publishes. For example:

```typescript
#! /usr/bin/env node
# src/bin.ts


import {generator} from '@social-native/snpkg-knex-migration-generator';


yargs.command({
    command: 'add-version-tables',
    describe: 'Adds db migrations for version tables',
    handler: async args => {
        await generator(args, './src/migrations', 'graphql_node_version', fn => fn(customTableAndColumnNames));
    }
});
```

### 2. Generator

To use, import the generator function. Pass it `command line args`, `relative path of migrations` and the `library name`. Optionally, you may pass it a function to create a closure scope around the generator function. This is a convient way to pass in additional information into the generator templates.

```typescript
import {generator} from '@social-native/snpkg-knex-migration-generator';
await generator(args, './src/migrations', 'graphql_node_version', fn => fn(customTableAndColumnNames));
```

Note:
The `args` have the type signature:

```typescript
export interface IArgs {
    [argName: string]: unknown;
    _: string[];
    $0: string;
}
```


### 3. Templates

A. Define you migrations as `generator templates`. Each template should be its own file in a migration folder. The migrations should be ordered. For example, you could have a folder structure like:

```
src/
  migrations/
    001_create_version_table.ts
    002_alter_version_table_add_column_hello.ts
```

B. Inside each you migration function you should return a `migration generator` function.

The types for this function are:
```typescript
export type MigrationFileExtension = 'js' | 'ts';

export type MigrationGenerator = (extension: MigrationFileExtension) => string;
```

C. In the generator template function you can include template fragments. For example, you may want to use ones for customizing the migration headers if you are unsure if the migrations will be used in a typescript or javascript repo.

Example:

```typescript
return (extension: MigrationFileExtension = 'js') => `
    ${importStatements(extension)}
    ${upMigrationDeclaration(extension)}
    await knex.schema.createTable('${table_names.event_implementor_type}', t => {
        t.increments('${event_implementor_type.id}')
            .unsigned()
            .primary();
        t.string('${event_implementor_type.type}').notNullable();
    });

    return await knex.table('${table_names.event_implementor_type}').insert([
        {
            type: '${EVENT_IMPLEMENTOR_TYPE_NAMES.NODE_CHANGE}',
            id: '${EVENT_IMPLEMENTOR_TYPE_IDS.NODE_CHANGE}'
        },
        {
            type: '${EVENT_IMPLEMENTOR_TYPE_NAMES.NODE_FRAGMENT_CHANGE}',
            id: '${EVENT_IMPLEMENTOR_TYPE_IDS.NODE_FRAGMENT_CHANGE}'
        },
        {
            type: '${EVENT_IMPLEMENTOR_TYPE_NAMES.LINK_CHANGE}',
            id: '${EVENT_IMPLEMENTOR_TYPE_IDS.LINK_CHANGE}'
        }
    ]);
}`
```