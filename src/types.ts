export type MigrationFileExtension = 'js' | 'ts';

export type MigrationGenerator = (libraryName: string, extension: MigrationFileExtension) => string;

export interface IArgs {
    [argName: string]: unknown;
    _: string[];
    $0: string;
}
