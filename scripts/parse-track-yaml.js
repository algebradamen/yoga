import fs from 'fs'
import path from 'path'
import YAML from 'yaml'

const __dirname = './scripts'

async function main() {
  const inputPath = path.join(__dirname, '..', 'sample-track.yaml');
  const outputPath = path.join(__dirname, '..', 'sample-track.json');

  const content = fs.readFileSync(inputPath, 'utf-8');

  const result = YAML.parse(content)

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
