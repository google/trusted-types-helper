/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  // Parse URL with query parameters
  const query = parsedUrl.query;
  // Specify the path to your static file
  const filePath = path.join(__dirname, 'test_page.html');

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }

    // Set custom HTTP headers and/or content
    let dataString = data.toString();
    const headers = {
      'Content-Type': 'text/html', // Adjust if serving a different file type
      'Cache-Control': 'no-cache' // Example custom header
    };
    if (query.header) {
      headers['Content-Security-Policy'] = "require-trusted-types-for 'script';";
      dataString = dataString.replace('Trusted Types headers', 'Trusted Types headers \u2611')
    }
    if (query.meta) {
      dataString = dataString.replace('Trusted Types meta tags', 'Trusted Types meta tags \u2611')
      dataString = dataString.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="require-trusted-types-for 'script';">`)
    }
    // TODO: Default policy and violation insertion too.

    res.writeHead(200, headers);

    res.end(dataString);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});