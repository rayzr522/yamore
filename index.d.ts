/**
 * processes a file, returning the parsed contents

 * @param {string} contents the contents of the file
 * @param {string} path the path of the file being processed, used to avoid circular references & for relative path resolution
 */
export function processContents(contents: string, path: string): any;
/**
 * loads the given file with preprocessing applied
 * @param {string} path the path of the file to load
 */
export function loadFile(path: string): any;
/**
 * @typedef {object} TransformResult
 * @property {any} parsed the parsed contents of the file
 * @property {string} stringified the stringified contents of the file
 */
/**
 * preprocesses the given file & writes it back to disk
 * @param {string} inputPath the path to load from
 * @param {string} outputPath the path to write to
 * @returns {TransformResult} the parsed & stringified contents of the file
 */
export function transformFile(inputPath: string, outputPath: string): TransformResult;
export type TransformResult = {
    /**
     * the parsed contents of the file
     */
    parsed: any;
    /**
     * the stringified contents of the file
     */
    stringified: string;
};
