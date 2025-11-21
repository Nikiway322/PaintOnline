// ui.js

export class UIManager {

    constructor(stompClient, drawManager) {
        this.stomp = stompClient;
        this.drawManager = drawManager;

        this.chatPanel = document.getElementById("right");
        this.toggleBtn = document.getElementById("chatToggleBtn");
        this.closeBtn = document.getElementById("chatCloseBtn");
        this.clearBtn = document.getElementById("clearBtn");

        this.register();
    }

    register() {

        // clear
        this.clearBtn.addEventListener("click", () => {
            this.stomp.send("/app/clear", {}, {});
            this.drawManager.clearCanvas();
        });

        // chat open
        this.toggleBtn?.addEventListener("click", () => {
            this.chatPanel.style.transform = "translateX(0)";
        });

        // chat close (мобильные)
        this.closeBtn?.addEventListener("click", () => {
            this.chatPanel.style.transform = "translateX(100%)";
        });
    }
}
