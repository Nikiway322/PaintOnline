// app.js
import { DrawManager } from "./draw.js";
import { ChatManager } from "./chat.js";
import { UIManager } from "./ui.js";

let stompClient = null;
let username = null;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// масштабирование canvas
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// подключение WS
function connectSocket() {
    const socket = new SockJS("/ws");
    stompClient = Stomp.over(socket);

    stompClient.connect({}, (frame) => {

        // подписки
        stompClient.subscribe("/topic/draw", (msg) => drawManager.onStrokeMessage(msg));
        stompClient.subscribe("/topic/chat", (msg) => chatManager.onChatMessage(msg));

        // инициализация холста
        stompClient.subscribe("/user/queue/init", (msg) => {
            const strokes = JSON.parse(msg.body);
            strokes.forEach(s => drawManager.drawStrokeLocal(s));
        });

        // join отправка
        stompClient.send("/app/join", {}, JSON.stringify({ user: username }));

    });
}

// обработка логина
document.getElementById("connectBtn").addEventListener("click", () => {
    username = document.getElementById("loginInput").value.trim();

    if (!username) return;
    document.cookie = "username=" + username;

    document.getElementById("modal").style.display = "none";
    connectSocket();
});

// загружаем username из cookie
const cookieUsername = document.cookie
    .split("; ")
    .find(r => r.startsWith("username="));

if (cookieUsername) {
    username = cookieUsername.split("=")[1];
    document.getElementById("loginInput").value = username;
}

// создаём менеджеры
let drawManager = new DrawManager(canvas, stompClient, username);
let chatManager = new ChatManager(stompClient, username);
let uiManager = new UIManager(stompClient, drawManager);
