package ru.paint.paintonline.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import ru.paint.paintonline.dto.ChatMessage;
import ru.paint.paintonline.dto.Stroke;
import ru.paint.paintonline.service.CanvasState;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@RequiredArgsConstructor
public class CanvasController {

    private final SimpMessagingTemplate messaging;
    private final CanvasState canvasState;

    // sessionId → username
    private final ConcurrentHashMap<String, String> users = new ConcurrentHashMap<>();

    /**
     * Когда пользователь подключается — сохраняем его имя
     * и отправляем ему текущий холст.
     */
    @MessageMapping("/join")
    public void join(@Payload Map<String, String> payload,
                     org.springframework.messaging.Message<?> message) {

        String username = payload.get("user");
        String sessionId = (String) message.getHeaders().get("simpSessionId");

        if (sessionId != null && username != null) {
            users.put(sessionId, username);
        }

        // отправляем текущий холст только этому пользователю
        List<Stroke> allStrokes = canvasState.getAll();

        messaging.convertAndSendToUser(
                sessionId,
                "/queue/init",
                allStrokes
        );

        broadcastUserList();
    }

    /**
     * Когда пользователь отключается
     */
    @MessageMapping("/leave")
    public void leave(org.springframework.messaging.Message<?> message) {
        String sessionId = (String) message.getHeaders().get("simpSessionId");

        if (sessionId != null) {
            users.remove(sessionId);
            broadcastUserList();
        }
    }

    /**
     * Чат
     */
    @MessageMapping("/chat")
    public void chat(ChatMessage msg) {
        messaging.convertAndSend("/topic/chat", msg);
    }

    /**
     * Обработка конкретного штриха
     */
    @MessageMapping("/draw")
    public void draw(@Payload Stroke stroke) {

        // сохраняем в историю
        canvasState.addStroke(stroke);

        // трансляция всем
        messaging.convertAndSend("/topic/draw", stroke);
    }

    /**
     * Очистка холста
     */
    @MessageMapping("/clear")
    public void clear() {
        canvasState.clear();
        messaging.convertAndSend("/topic/clear", "clear");
    }

    /**
     * Трансляция списка пользователей
     */
    private void broadcastUserList() {
        var list = users.values().stream().distinct().toList();
        messaging.convertAndSend("/topic/users", Map.of(
                "count", list.size(),
                "users", list
        ));
    }

}
