const http = require("http");
const app = require("./app");
const { PORT } = require("./config");

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
