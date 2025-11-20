package ru.paint.paintonline.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import ru.paint.paintonline.dto.ChatMessage;
import ru.paint.paintonline.dto.DrawMessage;
import ru.paint.paintonline.dto.UsersMessage;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@RequiredArgsConstructor
public class CanvasController {

    private final SimpMessagingTemplate messagingTemplate;

    // sessionId -> username
    private final ConcurrentHashMap<String, String> sessionToUser = new ConcurrentHashMap<>();

    // helper — update users topic
    private void broadcastUsers() {
        List<String> users = sessionToUser.values().stream().distinct().toList();
        UsersMessage msg = new UsersMessage(users.size(), users);
        messagingTemplate.convertAndSend("/topic/users", msg);
    }

    @MessageMapping("/join")
    public void joinUser(@Payload Map<String, String> payload, Message<?> message) {
        String user = payload.get("user");
        if (user == null || user.trim().isEmpty()) return;

        String sessionId = SimpMessageHeaderAccessor.getSessionId(message.getHeaders());
        if (sessionId != null) {
            sessionToUser.put(sessionId, user);
            broadcastUsers();
        }
    }

    @MessageMapping("/leave")
    public void leaveUser(@Payload Map<String, String> payload, Message<?> message) {
        String sessionId = SimpMessageHeaderAccessor.getSessionId(message.getHeaders());
        if (sessionId != null) {
            sessionToUser.remove(sessionId);
            broadcastUsers();
        }
    }

    @MessageMapping("/chat")
    public void chat(ChatMessage msg) {
        messagingTemplate.convertAndSend("/topic/chat", msg);
    }

    @MessageMapping("/draw")
    public void draw(DrawMessage msg) {
        messagingTemplate.convertAndSend("/topic/draw", msg);
    }

    // Exposed for event listener when session disconnects
    public void handleDisconnect(String sessionId) {
        if (sessionId == null) return;
        sessionToUser.remove(sessionId);
        broadcastUsers();
    }
}
