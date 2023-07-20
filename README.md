# yamore

[![npm version](https://badge.fury.io/js/yamore.svg)](https://npmjs.com/package/yamore)

> A simple preprocessor that adds more functionality to YAML in the form of preprocessing.

## usage

```js
// .github/process.js
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'
import { loadYamlFile } from 'yamore'

const baseDir = path.dirname(fileURLToPath(import.meta.url))
const templatesDir = path.join(baseDir, 'workflow-templates')
const outDir = path.join(baseDir, 'workflows')

for (const template of await fs.readdir(templatesDir)) {
  if (!template.endsWith('.yml')) continue
  const loadedTemplate = loadYamlFile(path.join(templatesDir, template))
  const stringifiedTemplate = YAML.stringify(loadedTemplate)
  console.log(`🤔 processing ${template}...`)
  await fs.writeFile(path.join(outDir, template), stringifiedTemplate)
  console.log(`✅ processed ${template}!`)
}
```
