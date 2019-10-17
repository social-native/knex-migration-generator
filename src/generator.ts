import Bluebird from 'bluebird';
import fs from 'fs';
import path from 'path';

import initKnex from './lib/knex/init-knex'; // tslint:disable-line
import {MigrationGenerator, IArgs} from './types';
import {templateFragments} from 'index';

const defaultMigrationFnExtractor = <Fn extends (...params: any[]) => any>(
    migrationFn: Fn
): MigrationGenerator => migrationFn;

export default async <Fn extends (...params: any[]) => MigrationGenerator>(
    args: IArgs,
    relativePathOfLibMigrations: string,
    libraryName: string,
    migrationFnExtractor?: Fn
) => {
    const env = process.env;
    env.cwd = process.cwd();
    env.modulePath = path.join(process.cwd(), 'node_modules', 'knex');
    const opts = {
        client: args.client || 'sqlite3',
        cwd: args.cwd,
        knexfile: args.knexfile,
        knexpath: args.knexpath,
        require: args.require,
        completion: args.completion
    } as any;

    opts.client = opts.client || 'sqlite3'; // We don't really care about client when creating migrations

    // instantiate knex client
    const knex = initKnex(Object.assign({}, env), opts);

    // get names of existing migrations
    const existingMigrations = fs.readdirSync(knex.migrate.config.directory);

    // set path of the libraries migration directory
    const libMigrationDir = path.resolve(relativePathOfLibMigrations);

    // regex to match filename irrespective of extension
    const libMigrationFileName = /(.*).(ts|js)/;
    const libMigrationFiles = fs.readdirSync(libMigrationDir);

    // figure out which lib migrations haven't been added yet
    const newMigrations = [] as Array<{migrationName: string; fileName: string}>;
    libMigrationFiles.forEach(fileName => {
        const match = fileName.match(libMigrationFileName);
        const potentialMigrationName = match && match[1];
        if (potentialMigrationName) {
            const matchingMigration = existingMigrations.find(m =>
                m.includes(potentialMigrationName)
            );

            if (matchingMigration === undefined) {
                newMigrations.push({fileName, migrationName: potentialMigrationName});
            }
        }
    });

    // used to create closure scopes around the migration generators in case the user
    // wants to pass additional information into the migration template
    const _migrationFnExtractor = migrationFnExtractor || defaultMigrationFnExtractor;

    await Bluebird.map(newMigrations, async ({migrationName, fileName}) => {
        // create a migration file for each new migration
        const newMigrationFileNamePath = await knex.migrate.make(`${libraryName}_${migrationName}`);

        // import the lib migration file
        const libMigrationFilePath = path.resolve(libMigrationDir, fileName);
        const migrationFile = _migrationFnExtractor(require(libMigrationFilePath).default);

        const migrationFileExtension = knex.migrate.config.extension;
        if (migrationFileExtension !== 'js' && migrationFileExtension !== 'ts') {
            throw new Error(
                `Migration file extension calculated to be ${migrationFileExtension}. It must be either 'js' or 'ts'`
            );
        }
        const migrationText = migrationFile(knex.migrate.config.extension);

        console.log(`Writing migration to: ${newMigrationFileNamePath}`); // tslint:disable-line
        // add the header
        fs.writeFileSync(newMigrationFileNamePath, templateFragments.warningHeader(libraryName));

        // write the lib migration contents to the new migration file
        fs.appendFile(newMigrationFileNamePath, migrationText, err => {
            if (err) {
                throw err;
            }

            console.log(`Migration added: ${fileName}`); // tslint:disable-line
        });
    });
};
