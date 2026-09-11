/**
 * Sync src/locales/*.yaml → *.json (app imports JSON at build time — no extra Vite plugins).
 * Run after editing YAML: npm run locales:sync
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/locales')

for (const name of ['en', 'pl']) {
  const yamlPath = path.join(dir, `${name}.yaml`)
  const jsonPath = path.join(dir, `${name}.json`)
  const data = yaml.load(fs.readFileSync(yamlPath, 'utf8'))
  fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`)
  console.log(`Wrote ${jsonPath}`)
}
