package ru.paint.paintonline.service;

import org.springframework.stereotype.Component;
import ru.paint.paintonline.dto.Stroke;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class CanvasState {

    // Храним полный список всех линий
    private final List<Stroke> strokes = new CopyOnWriteArrayList<>();

    public void addStroke(Stroke stroke) {
        strokes.add(stroke);
    }

    public List<Stroke> getAll() {
        return strokes;
    }

    public void clear() {
        strokes.clear();
    }
}