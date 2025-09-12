package com.example.KajChai.DTO;

import com.example.KajChai.Enum.ForumSection;
import com.example.KajChai.Enum.ForumCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateForumPostRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    @NotNull(message = "Section is required")
    private ForumSection section;

    @NotNull(message = "Category is required")
    private ForumCategory category;

    private List<String> photoUrls;
}