// utils cookies
function setCookie(name, value, days=365) {
    const d = new Date(); d.setTime(d.getTime() + (days*24*60*60*1000));
    document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + d.toUTCString() + ";path=/";
}
function getCookie(name) {
    const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? decodeURIComponent(v.pop()) : null;
}

/* UI refs */
const modal = document.getElementById('modal');
const loginInput = document.getElementById('loginInput');
const connectBtn = document.getElementById('connectBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const colorPicker = document.getElementById('colorPicker');
const chat = document.getElementById('chat');
const chatInput = document.getElementById('chatInput');
const userCountEl = document.getElementById('userCount');
const clearBtn = document.getElementById('clearBtn');

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    // preserve
    const temp = document.createElement('canvas');
    temp.width = canvas.width; temp.height = canvas.height;
    temp.getContext('2d').drawImage(canvas,0,0);
    canvas.width = w; canvas.height = h;
    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,w,h);
    ctx.drawImage(temp,0,0, temp.width, temp.height, 0,0,w,h);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* WS */
let stompClient = null;
let username = getCookie('nick') || null;

function connectSocket() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.debug = null;
    stompClient.connect({}, function(frame) {
        console.log('Connected: ' + frame);
        stompClient.subscribe('/topic/draw', onDrawMessage);
        stompClient.subscribe('/topic/chat', onChatMessage);
        stompClient.subscribe('/topic/users', onUsersMessage);
        stompClient.send('/app/join', {}, JSON.stringify({ user: username }));
        // if user leaves page, inform server
        window.addEventListener('beforeunload', () => {
            try {
                stompClient.send('/app/leave', {}, JSON.stringify({ user: username }));
            } catch (e) {}
        });
    }, function(error) {
        console.error('STOMP error', error);
    });
}

/* Incoming handlers */
const remotePaths = {};

function onDrawMessage(m) {
    const msg = JSON.parse(m.body);
    if (msg.user === username) return;
    if (msg.type === 'start') {
        remotePaths[msg.user] = { lastX: msg.x, lastY: msg.y, color: msg.color };
    } else if (msg.type === 'move') {
        const p = remotePaths[msg.user];
        if (!p) return;
        drawLine(p.lastX, p.lastY, msg.x, msg.y, msg.color);
        p.lastX = msg.x; p.lastY = msg.y;
    } else if (msg.type === 'end') {
        delete remotePaths[msg.user];
    } else if (msg.type === 'clear') {
        ctx.fillStyle = "#fff"; ctx.fillRect(0,0,canvas.width,canvas.height);
    }
}

function onChatMessage(m) {
    const msg = JSON.parse(m.body);
    const el = document.createElement('div');
    el.textContent = '[' + msg.user + '] ' + msg.text;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
}

function onUsersMessage(m) {
    const msg = JSON.parse(m.body);
    userCountEl.textContent = msg.count;
}

/* Chat send */
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim()) {
        const payload = { user: username, text: chatInput.value.trim() };
        stompClient.send('/app/chat', {}, JSON.stringify(payload));
        chatInput.value = '';
    }
});

/* Drawing logic */
let drawing = false;
let lastX = 0, lastY = 0;

function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
}
function drawLine(x1,y1,x2,y2, color) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
}

let lastSend = 0;
function sendDraw(msg) {
    if (!stompClient) return;
    stompClient.send('/app/draw', {}, JSON.stringify(msg));
}

canvas.addEventListener('pointerdown', (e) => {
    drawing = true;
    const p = canvasPos(e);
    lastX = p.x; lastY = p.y;
    drawLine(lastX, lastY, lastX, lastY, colorPicker.value);
    sendDraw({ type:'start', user:username, color: colorPicker.value, x:lastX, y:lastY });
    canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const p = canvasPos(e);
    drawLine(lastX, lastY, p.x, p.y, colorPicker.value);
    lastX = p.x; lastY = p.y;
    const now = Date.now();
    if (now - lastSend > 30) {
        sendDraw({ type:'move', user:username, color: colorPicker.value, x:lastX, y:lastY });
        lastSend = now;
    }
});
canvas.addEventListener('pointerup', (e) => {
    if (!drawing) return;
    drawing = false;
    sendDraw({ type:'end', user:username });
    canvas.releasePointerCapture(e.pointerId);
});
canvas.addEventListener('pointerleave', (e) => {
    if (drawing) {
        drawing = false;
        sendDraw({ type:'end', user:username });
    }
});

clearBtn.addEventListener('click', () => {
    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,canvas.width,canvas.height);
    if (stompClient) stompClient.send('/app/draw', {}, JSON.stringify({ type:'clear', user:username }));
});

/* Login flow */
function onConnectedWithName(name) {
    username = name;
    setCookie('nick', name);
    modal.style.display = 'none';
    connectSocket();
}

connectBtn.addEventListener('click', () => {
    const val = loginInput.value.trim();
    if (!val) { alert('Введите ник'); return; }
    onConnectedWithName(val);
});

if (username) {
    loginInput.value = username;
    onConnectedWithName(username);
}
