import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";

const app = express();
app.use(express.static("site"));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws: WebSocket) => {
	ws.on("message", (message: string) => {
		console.log(`ws message: ${JSON.stringify(message)}`);
	});
});

const port = Number(process.env.PORT || 5775);
server.listen(port, () => {
	console.log(`Server started:\n  http://localhost:${port}/optimize.html`);
});
