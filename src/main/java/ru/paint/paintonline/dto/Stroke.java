package ru.paint.paintonline.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Stroke {
    private String user;
    private String color;
    private double x1;
    private double y1;
    private double x2;
    private double y2;
    private double brushSize;
}