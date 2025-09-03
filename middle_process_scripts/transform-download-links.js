const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');

/**
 * Transform downloadLink URLs from detail pages to PDF URLs
 * Pattern: https://jcpage.jp/tec/detail.php?id=36 → https://jcpage.jp/tec/pdf/jctec0036.pdf
 */

function transformDownloadLink(url) {
  // Extract ID from URL pattern: https://jcpage.jp/tec/detail.php?id={number}
  const match = url.match(/detail\.php\?id=(\d+)/);
  
  if (!match) {
    console.warn(`Warning: Unable to extract ID from URL: ${url}`);
    return url; // Return original URL if pattern doesn't match
  }
  
  const id = match[1];
  // Zero-pad to 4 digits
  const paddedId = id.padStart(4, '0');
  // Generate new PDF URL
  return `https://jcpage.jp/tec/pdf/jctec${paddedId}.pdf`;
}

function processJsonFile() {
  const jsonFilePath = path.join(projectRoot, 'data', 'japanese-tech-database.json');
  const backupPath = jsonFilePath + '.backup';
  
  try {
    // Read the JSON file
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    // Create backup
    fs.copyFileSync(jsonFilePath, backupPath);
    console.log(`✓ Created backup: ${backupPath}`);
    
    let transformCount = 0;
    
    // Transform each technology's downloadLink
    if (jsonData.technologies && Array.isArray(jsonData.technologies)) {
      jsonData.technologies.forEach((tech, index) => {
        if (tech.downloadLink) {
          const originalUrl = tech.downloadLink;
          const transformedUrl = transformDownloadLink(originalUrl);
          
          if (originalUrl !== transformedUrl) {
            tech.downloadLink = transformedUrl;
            transformCount++;
            console.log(`${index + 1}: ${originalUrl} → ${transformedUrl}`);
          }
        }
      });
    }
    
    // Write the updated JSON
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`✓ JSON file updated: ${transformCount} URLs transformed`);
    
    return transformCount;
    
  } catch (error) {
    console.error('Error processing JSON file:', error);
    throw error;
  }
}

function processCsvFile() {
  const csvFilePath = path.join(projectRoot, 'data', 'japanese-tech-database.csv');
  const backupPath = csvFilePath + '.backup';
  
  try {
    // Read the CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    const lines = csvContent.split('\n');
    
    // Create backup
    fs.copyFileSync(csvFilePath, backupPath);
    console.log(`✓ Created backup: ${backupPath}`);
    
    let transformCount = 0;
    
    // Process each line (assuming downloadLink is in column 6, 0-indexed)
    const transformedLines = lines.map((line, lineIndex) => {
      if (line.trim() === '') return line; // Skip empty lines
      
      // Simple CSV parsing (assuming no commas within quoted fields for downloadLink column)
      const columns = line.split(',');
      
      if (columns.length > 6 && columns[6]) {
        const downloadLinkColumn = columns[6];
        
        // Check if this looks like a downloadLink URL
        if (downloadLinkColumn.includes('detail.php?id=')) {
          const originalUrl = downloadLinkColumn;
          const transformedUrl = transformDownloadLink(originalUrl);
          
          if (originalUrl !== transformedUrl) {
            columns[6] = transformedUrl;
            transformCount++;
            console.log(`Line ${lineIndex + 1}: ${originalUrl} → ${transformedUrl}`);
          }
        }
      }
      
      return columns.join(',');
    });
    
    // Write the updated CSV
    fs.writeFileSync(csvFilePath, transformedLines.join('\n'), 'utf8');
    console.log(`✓ CSV file updated: ${transformCount} URLs transformed`);
    
    return transformCount;
    
  } catch (error) {
    console.error('Error processing CSV file:', error);
    throw error;
  }
}

function validateTransformation() {
  const jsonFilePath = path.join(projectRoot, 'data', 'japanese-tech-database.json');
  
  try {
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    let totalRecords = 0;
    let pdfUrls = 0;
    let detailUrls = 0;
    
    if (jsonData.technologies && Array.isArray(jsonData.technologies)) {
      jsonData.technologies.forEach((tech) => {
        if (tech.downloadLink) {
          totalRecords++;
          
          if (tech.downloadLink.includes('/pdf/jctec') && tech.downloadLink.endsWith('.pdf')) {
            pdfUrls++;
          } else if (tech.downloadLink.includes('detail.php?id=')) {
            detailUrls++;
            console.log(`Warning: Untransformed URL found: ${tech.downloadLink}`);
          }
        }
      });
    }
    
    console.log('\n=== Validation Results ===');
    console.log(`Total records with downloadLink: ${totalRecords}`);
    console.log(`PDF URLs: ${pdfUrls}`);
    console.log(`Detail URLs (should be 0): ${detailUrls}`);
    console.log(`Success rate: ${totalRecords > 0 ? ((pdfUrls / totalRecords) * 100).toFixed(1) : 0}%`);
    
    return { totalRecords, pdfUrls, detailUrls };
    
  } catch (error) {
    console.error('Error validating transformation:', error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting downloadLink transformation...\n');
  
  try {
    console.log('📄 Processing JSON file...');
    const jsonTransformed = processJsonFile();
    
    console.log('\n📊 Processing CSV file...');
    const csvTransformed = processCsvFile();
    
    console.log('\n🔍 Validating transformation...');
    const validation = validateTransformation();
    
    console.log('\n✅ Transformation completed successfully!');
    console.log(`JSON: ${jsonTransformed} URLs transformed`);
    console.log(`CSV: ${csvTransformed} URLs transformed`);
    
  } catch (error) {
    console.error('\n❌ Transformation failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { transformDownloadLink, processJsonFile, processCsvFile, validateTransformation };
