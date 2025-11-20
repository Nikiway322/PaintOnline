package ru.paint.paintonline.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DrawMessage {
    private String type; // start|move|end|clear
    private String user;
    private String color;
    private Double x;
    private Double y;
}