const fs = require('fs');
const path = require('path');
const { MarkdownParser } = require('@loopstack/markdown-parser');

const schema = {
  type: 'object',
  properties: {
    poses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          duration: { type: 'string' },
          description: { type: 'string' },
          sensation: { type: 'string' },
          counterPose: { type: 'string' },
          meridians: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

async function main() {
  const inputPath = path.join(__dirname, '..', 'sample-track.md');
  const outputPath = path.join(__dirname, '..', 'sample-track.json');

  const content = fs.readFileSync(inputPath, 'utf-8');
  const parser = new MarkdownParser();

  const raw = await parser.parseToObject(content, schema);

  // Convert poses object (keyed by pose name) to array with name injected
  const posesObj = raw.poses || {};
  const poses = Object.entries(posesObj).map(([name, data]) => ({
    name,
    ...data,
  }));

  const result = { poses };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
