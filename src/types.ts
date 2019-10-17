export type MigrationFileExtension = 'js' | 'ts';

export type MigrationGenerator = (extension: MigrationFileExtension) => string;

export interface IArgs {
    [argName: string]: unknown;
    _: string[];
    $0: string;
}
