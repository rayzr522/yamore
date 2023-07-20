import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import YAML from 'yaml'

/** @typedef {import('yaml').DocumentOptions &import('yaml').SchemaOptions & import('yaml').ParseOptions & import('yaml').CreateNodeOptions & import('yaml').ToStringOptions} StringifyOptions */
/** @type {StringifyOptions} */
const STRINGIFY_OPTIONS = {
  lineWidth: Infinity,
  aliasDuplicateObjects: false,
}

class IncludedFile {
  /**
   * @param {unknown} contents
   * @param {boolean} shouldMerge
   */
  constructor(contents, shouldMerge) {
    this.contents = contents
    this.shouldMerge = shouldMerge
  }
}

/**
 * @param {string} baseDir
 * @returns {import('yaml').Tags}
 */
function getCustomTags(baseDir) {
  return [
    {
      tag: '!include',
      identify(value) {
        return !!(value && value instanceof IncludedFile)
      },
      resolve(str) {
        let shouldMerge = false
        if (str.startsWith('merge:')) {
          shouldMerge = true
          str = str.slice(6)
        }
        return new IncludedFile(
          processFile(resolve(baseDir, str.trim())),
          shouldMerge,
        )
      },
    },
  ]
}

function flattenIncludes(obj) {
  if (obj instanceof IncludedFile) {
    return obj.contents
  } else if (Array.isArray(obj)) {
    const out = []
    for (const value of obj) {
      if (value instanceof IncludedFile && Array.isArray(value.contents)) {
        const flattenedContents = value.contents.map(flattenIncludes)
        if (value.shouldMerge) {
          out.push(...flattenedContents)
        } else {
          out.push(flattenedContents)
        }
      } else {
        out.push(flattenIncludes(value))
      }
    }
    return out
  } else if (obj && typeof obj === 'object') {
    for (const key in obj) {
      obj[key] = flattenIncludes(obj[key])
    }
  }
  return obj
}

/** @type {Set<string>} */
const currentlyResolving = new Set()
/** @type {Map<string, unknown>} */
const resolved = new Map()

/**
 * processes a file, returning the parsed contents

 * @param {string} contents the contents of the file
 * @param {string} path the path of the file being processed, used to avoid circular references & for relative path resolution
 */
export function processContents(contents, path) {
  if (resolved.has(path)) {
    return resolved.get(path)
  }
  if (currentlyResolving.has(path)) {
    throw new Error(`Circular reference: ${path}`)
  }
  currentlyResolving.add(path)

  const customTags = getCustomTags(dirname(path))
  const withIncludesResolved = YAML.parse(contents, { customTags })
  const flattened = flattenIncludes(withIncludesResolved)
  const reserialized = YAML.stringify(flattened, STRINGIFY_OPTIONS)
  const merged = YAML.parse(reserialized, { merge: true })
  currentlyResolving.delete(path)
  resolved.set(path, merged)
  return merged
}

/**
 * loads the given file with preprocessing applied
 * @param {string} path the path of the file to load
 */
export function processFile(path) {
  const contents = fs.readFileSync(path, 'utf-8')
  return processContents(contents, path)
}

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
export function transformFile(inputPath, outputPath) {
  const parsed = processFile(inputPath)
  const stringified = YAML.stringify(parsed, STRINGIFY_OPTIONS)
  fs.writeFileSync(outputPath, stringified)
  return { parsed, stringified }
}
