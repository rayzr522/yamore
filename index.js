import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import YAML from 'yaml'

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
 * @param {string} path
 * @returns {import('yaml').Tags}
 */
function getCustomTags(path) {
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
          loadYamlFile(resolve(dirname(path), str.trim())),
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
/** @tpye {Map<string, unknown>} */
const resolved = new Map()

/** @param {string} path */
export function loadYamlFile(path) {
  const customTags = getCustomTags(path)
  if (resolved.has(path)) {
    return resolved.get(path)
  }
  if (currentlyResolving.has(path)) {
    throw new Error(`Circular reference: ${path}`)
  }
  currentlyResolving.add(path)
  const rawContents = fs.readFileSync(path, 'utf-8')
  const withIncludesResolved = YAML.parse(rawContents, { customTags })
  const flattened = flattenIncludes(withIncludesResolved)
  const reserialized = YAML.stringify(flattened)
  const merged = YAML.parse(reserialized, { merge: true })
  currentlyResolving.delete(path)
  resolved.set(path, merged)
  return merged
}