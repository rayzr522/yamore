# yamore

[![npm version](https://badge.fury.io/js/yamore.svg)](https://npmjs.com/package/yamore)

> A simple preprocessor that adds more functionality to YAML in the form of preprocessing.

## usage

```js
// .github/process.js
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformFile } from 'yamore'

const baseDir = path.dirname(fileURLToPath(import.meta.url))
const templatesDir = path.join(baseDir, 'workflow-templates')
const outDir = path.join(baseDir, 'workflows')

for (const template of await fs.readdir(templatesDir)) {
  if (!template.endsWith('.yml')) continue
  console.log(`🤔 processing ${template}...`)
  transformFile(path.join(templatesDir, template), path.join(outDir, template))
  console.log(`✅ processed ${template}!`)
}
```
