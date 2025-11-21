// draw.js
import { getCanvasPos } from "./utils.js";

export class DrawManager {

    constructor(canvas, stompClient, username) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.stomp = stompClient;
        this.username = username;

        this.brushSizeInput = document.getElementById("brushSize");
        this.colorPicker = document.getElementById("colorPicker");

        this.drawing = false;
        this.lastX = 0;
        this.lastY = 0;

        this.registerEvents();
    }

    // --- локальная отрисовка stroke ---
    drawStrokeLocal(s) {
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.lineWidth = s.brushSize;
        this.ctx.strokeStyle = s.color;
        this.ctx.beginPath();
        this.ctx.moveTo(s.x1, s.y1);
        this.ctx.lineTo(s.x2, s.y2);
        this.ctx.stroke();
    }

    // --- отправка на сервер ---
    sendStroke(s) {
        if (!this.stomp) return;
        this.stomp.send("/app/draw", {}, JSON.stringify(s));
    }

    // --- обработка stroke от сервера ---
    onStrokeMessage(msg) {
        const s = JSON.parse(msg.body);
        this.drawStrokeLocal(s);
    }

    // --- События рисования ---
    startDrawing(e) {
        const pos = getCanvasPos(this.canvas, e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        this.drawing = true;
    }

    moveDrawing(e) {
        if (!this.drawing) return;

        const pos = getCanvasPos(this.canvas, e);

        const stroke = {
            user: this.username,
            color: this.colorPicker.value,
            brushSize: parseFloat(this.brushSizeInput.value),
            x1: this.lastX,
            y1: this.lastY,
            x2: pos.x,
            y2: pos.y
        };

        this.drawStrokeLocal(stroke);
        this.sendStroke(stroke);

        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    stopDrawing() {
        this.drawing = false;
    }

    registerEvents() {
        this.canvas.addEventListener("mousedown", (e) => this.startDrawing(e));
        this.canvas.addEventListener("mousemove", (e) => this.moveDrawing(e));
        this.canvas.addEventListener("mouseup", () => this.stopDrawing());
        this.canvas.addEventListener("mouseleave", () => this.stopDrawing());

        this.canvas.addEventListener("touchstart", (e) => this.startDrawing(e));
        this.canvas.addEventListener("touchmove", (e) => {
            e.preventDefault();
            this.moveDrawing(e);
        });
        this.canvas.addEventListener("touchend", () => this.stopDrawing());
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
