const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\982c3f25-f765-4232-b2f3-4cabd56d9322\\.system_generated\\logs\\transcript.jsonl';

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('fileContent')) {
      try {
        const obj = JSON.parse(line);
        // Find any tool calls or content with fileContent
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            if (tc.args && tc.args.fileContent) {
              console.log(`Line ${index + 1}: Tool ${tc.name}, file: ${tc.args.fileName}`);
              console.log("fileContent start:", tc.args.fileContent.slice(0, 1000));
            }
          });
        }
      } catch (err) {}
    }
  });
} else {
  console.log('Log file not found');
}
