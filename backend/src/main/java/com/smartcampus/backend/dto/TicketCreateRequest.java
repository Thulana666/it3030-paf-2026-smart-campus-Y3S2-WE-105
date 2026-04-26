package com.smartcampus.backend.dto;

import com.smartcampus.backend.model.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketCreateRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Contact details are required")
    private String contactDetails;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    // Optional field linking to a facility
    private String resourceId; 
}
