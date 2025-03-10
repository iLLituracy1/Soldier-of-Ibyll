// bundle.js
// A simple Node.js script that combines all your separate files back into one HTML file

const fs = require('fs');
const path = require('path');

console.log('Starting bundling process...');

// Read the HTML template
let html = fs.readFileSync('index.html', 'utf8');
console.log('Read index.html template.');

// Replace CSS link with inline styles
const css = fs.readFileSync(path.join('css', 'style.css'), 'utf8');
html = html.replace('<link rel="stylesheet" href="css/style.css">', `<style>\n${css}\n</style>`);
console.log('Inlined CSS styles.');

// Find all script tags
const scriptRegex = /<script src="(.*?)"><\/script>/g;
let match;
let modifiedHtml = html;
let scriptTags = [];

// Extract all script tags
while ((match = scriptRegex.exec(html)) !== null) {
  scriptTags.push({
    fullTag: match[0],
    path: match[1]
  });
}

console.log(`Found ${scriptTags.length} script tags to process.`);

// Replace each script tag with its content
scriptTags.forEach(scriptTag => {
  try {
    const scriptContent = fs.readFileSync(scriptTag.path, 'utf8');
    modifiedHtml = modifiedHtml.replace(
      scriptTag.fullTag, 
      `<script>\n// Source: ${scriptTag.path}\n${scriptContent}\n</script>`
    );
    console.log(`Processed: ${scriptTag.path}`);
  } catch (error) {
    console.error(`Error processing ${scriptTag.path}:`, error.message);
  }
});

// Create bundle directory if it doesn't exist
if (!fs.existsSync('bundle')) {
  fs.mkdirSync('bundle');
  console.log('Created bundle directory.');
}

// Write the bundled file
fs.writeFileSync(path.join('bundle', 'game.html'), modifiedHtml);
console.log('Bundle complete! Created bundle/game.html');
