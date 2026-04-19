const fs = require('fs');
const path = require('path');

const mdDir = path.join(process.cwd(), 'src/content/gallery');
const jsonDir = path.join(process.env.HOME, 'pictures/wallpaper');

const mdFiles = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));

mdFiles.forEach(file => {
  const stem = path.parse(file).name;
  const jsonPath = path.join(jsonDir, `${stem}.json`);

  if (fs.existsSync(jsonPath)) {
    try {
      const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const width = jsonContent['File:ImageWidth'];
      const height = jsonContent['File:ImageHeight'];

      if (width && height) {
        const mdPath = path.join(mdDir, file);
        let content = fs.readFileSync(mdPath, 'utf8');

        // Split frontmatter
        const parts = content.split('---');
        if (parts.length >= 3) {
          let frontmatter = parts[1];

          // Add width and height if not already present
          if (!frontmatter.includes('width:')) {
            frontmatter += `\\nwidth: ${width}`;
          }
          if (!frontmatter.includes('height:')) {
            frontmatter += `\\nheight: ${height}`;
          }

          const newContent = `---\\n${frontmatter.trim()}\\n---\\n${parts.slice(2).join('---')}`;
          fs.writeFileSync(mdPath, newContent);
          console.log(`Updated ${file} with ${width}x${height}`);
        }
      }
    } catch (e) {
      console.error(`Error processing ${file}: ${e.message}`);
    }
  } else {
    console.log(`JSON not found for ${file}`);
  }
});
