const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const webPort = Number(process.env.PORT || 8081);
const expoPort = Number(process.env.EXPO_WEB_PORT || 8082);
const expoCli = require.resolve('expo/bin/cli', { paths: [projectRoot] });
const isolationHeaders = new Set([
  'cross-origin-embedder-policy',
  'cross-origin-opener-policy',
]);

let expoProcess;

const server = http.createServer((request, response) => {
  const upstream = http.request(
    {
      hostname: '127.0.0.1',
      port: expoPort,
      method: request.method,
      path: request.url,
      headers: request.headers,
    },
    (upstreamResponse) => {
      const headers = Object.fromEntries(
        Object.entries(upstreamResponse.headers).filter(
          ([name]) => !isolationHeaders.has(name.toLowerCase())
        )
      );
      response.writeHead(upstreamResponse.statusCode || 502, {
        ...headers,
        'Cross-Origin-Embedder-Policy': 'credentialless',
        'Cross-Origin-Opener-Policy': 'same-origin',
      });
      upstreamResponse.pipe(response);
    }
  );

  upstream.on('error', (error) => {
    console.error('Falha ao encaminhar solicitação ao Expo:', error);
    if (response.headersSent) {
      response.destroy(error);
      return;
    }
    response.writeHead(502);
    response.end('Servidor Expo indisponível.');
  });

  request.pipe(upstream);
});

server.on('upgrade', (request, socket, head) => {
  const upstream = http.request({
    hostname: '127.0.0.1',
    port: expoPort,
    method: 'GET',
    path: request.url,
    headers: request.headers,
  });

  upstream.on('upgrade', (response, upstreamSocket, upstreamHead) => {
    socket.write(`HTTP/${response.httpVersion} ${response.statusCode} ${response.statusMessage}\r\n`);
    for (const [name, value] of Object.entries(response.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) socket.write(`${name}: ${item}\r\n`);
      } else if (value !== undefined) {
        socket.write(`${name}: ${value}\r\n`);
      }
    }
    socket.write('\r\n');
    if (head.length) upstreamSocket.write(head);
    if (upstreamHead.length) socket.write(upstreamHead);
    socket.pipe(upstreamSocket);
    upstreamSocket.pipe(socket);
  });

  upstream.on('response', (response) => {
    socket.write(`HTTP/${response.httpVersion} ${response.statusCode} ${response.statusMessage}\r\n`);
    for (const [name, value] of Object.entries(response.headers)) {
      socket.write(`${name}: ${value}\r\n`);
    }
    socket.write('\r\n');
    response.pipe(socket);
  });

  upstream.on('error', () => socket.destroy());
  upstream.end();
});

server.on('error', (error) => {
  console.error('Nao foi possivel iniciar o servidor web:', error);
  expoProcess?.kill('SIGINT');
  process.exitCode = 1;
});

server.listen(webPort, () => {
  console.log(`WinXadrez web disponivel em http://localhost:${webPort}`);
  expoProcess = spawn(
    process.execPath,
    [expoCli, 'start', '--web', '--port', String(expoPort)],
    { cwd: projectRoot, stdio: 'inherit' }
  );
  expoProcess.on('exit', (code) => {
    server.close();
    process.exitCode = code ?? 0;
  });
});

const stop = () => {
  expoProcess?.kill('SIGINT');
  server.close();
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
