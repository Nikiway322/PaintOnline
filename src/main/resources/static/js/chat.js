// chat.js
export class ChatManager {

    constructor(stompClient, username) {
        this.stomp = stompClient;
        this.username = username;
        this.chatBox = document.getElementById("chat");
        this.chatInput = document.getElementById("chatInput");
        this.sendBtn = document.getElementById("sendMsgBtn");

        this.registerEvents();
    }

    registerEvents() {
        this.sendBtn.addEventListener("click", () => this.sendMessage());
        this.chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.sendMessage();
        });
    }

    sendMessage() {
        const text = this.chatInput.value.trim();
        if (!text) return;

        const msg = {
            user: this.username,
            text: text
        };

        this.stomp.send("/app/chat", {}, JSON.stringify(msg));
        this.chatInput.value = "";
    }

    onChatMessage(msg) {
        const m = JSON.parse(msg.body);

        const div = document.createElement("div");
        div.innerHTML = `<b>${m.user}:</b> ${m.text}`;
        this.chatBox.appendChild(div);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }
}
