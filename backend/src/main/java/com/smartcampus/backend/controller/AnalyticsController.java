package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.*;
import com.smartcampus.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final ResourceRepository resourceRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        Map<String, Object> analytics = new LinkedHashMap<>();

        // ── Users ─────────────────────────────────────────
        List<User> allUsers = userRepository.findAll();
        Map<String, Object> users = new LinkedHashMap<>();
        users.put("total", allUsers.size());

        Map<String, Long> usersByRole = allUsers.stream()
                .collect(Collectors.groupingBy(
                        u -> u.getRole() != null ? u.getRole().name() : "UNKNOWN",
                        Collectors.counting()));
        users.put("byRole", usersByRole);

        // Recent registrations (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long recentUsers = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(thirtyDaysAgo))
                .count();
        users.put("recentRegistrations", recentUsers);

        // User registration trend (last 7 days)
        List<Map<String, Object>> userTrend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            long count = allUsers.stream()
                    .filter(u -> u.getCreatedAt() != null
                            && u.getCreatedAt().toLocalDate().equals(date))
                    .count();
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", date.toString());
            day.put("count", count);
            userTrend.add(day);
        }
        users.put("trend", userTrend);
        analytics.put("users", users);

        // ── Bookings ──────────────────────────────────────
        List<Booking> allBookings = bookingRepository.findAll();
        Map<String, Object> bookings = new LinkedHashMap<>();
        bookings.put("total", allBookings.size());

        Map<String, Long> bookingsByStatus = allBookings.stream()
                .collect(Collectors.groupingBy(
                        b -> b.getStatus() != null ? b.getStatus().name() : "UNKNOWN",
                        Collectors.counting()));
        bookings.put("byStatus", bookingsByStatus);

        // Most booked resources (top 5) — resolve IDs to names
        List<Resource> allResources = resourceRepository.findAll();
        Map<String, String> resourceNameMap = allResources.stream()
                .collect(Collectors.toMap(Resource::getId, r -> {
                    String display = r.getName() != null ? r.getName() : r.getResourceCode();
                    if (r.getType() != null) display += " (" + r.getType() + ")";
                    if (r.getLocation() != null) display += " - " + r.getLocation();
                    return display;
                }, (a, b) -> a));

        Map<String, Long> byResource = allBookings.stream()
                .filter(b -> b.getResourceId() != null)
                .collect(Collectors.groupingBy(Booking::getResourceId, Collectors.counting()));
        List<Map<String, Object>> topResources = byResource.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("resourceId", resourceNameMap.getOrDefault(e.getKey(), e.getKey()));
                    m.put("count", e.getValue());
                    return m;
                })
                .collect(Collectors.toList());
        bookings.put("topResources", topResources);

        // Booking trend (last 7 days)
        List<Map<String, Object>> bookingTrend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            long count = allBookings.stream()
                    .filter(b -> b.getStartTime() != null
                            && b.getStartTime().toLocalDate().equals(date))
                    .count();
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", date.toString());
            day.put("count", count);
            bookingTrend.add(day);
        }
        bookings.put("trend", bookingTrend);

        // Approval rate
        long approved = bookingsByStatus.getOrDefault("APPROVED", 0L);
        long totalDecided = approved + bookingsByStatus.getOrDefault("REJECTED", 0L);
        bookings.put("approvalRate", totalDecided > 0 ? Math.round((approved * 100.0) / totalDecided) : 0);

        analytics.put("bookings", bookings);

        // ── Tickets ───────────────────────────────────────
        List<Ticket> allTickets = ticketRepository.findAll();
        Map<String, Object> tickets = new LinkedHashMap<>();
        tickets.put("total", allTickets.size());

        Map<String, Long> ticketsByStatus = allTickets.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getStatus() != null ? t.getStatus().name() : "UNKNOWN",
                        Collectors.counting()));
        tickets.put("byStatus", ticketsByStatus);

        Map<String, Long> ticketsByPriority = allTickets.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getPriority() != null ? t.getPriority().name() : "UNKNOWN",
                        Collectors.counting()));
        tickets.put("byPriority", ticketsByPriority);

        Map<String, Long> ticketsByCategory = allTickets.stream()
                .filter(t -> t.getCategory() != null)
                .collect(Collectors.groupingBy(Ticket::getCategory, Collectors.counting()));
        tickets.put("byCategory", ticketsByCategory);

        // Average resolution time (in hours) for resolved/closed tickets
        OptionalDouble avgResTime = allTickets.stream()
                .filter(t -> t.getStatus() != null
                        && (t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED)
                        && t.getCreatedAt() != null && t.getUpdatedAt() != null)
                .mapToLong(t -> ChronoUnit.HOURS.between(t.getCreatedAt(), t.getUpdatedAt()))
                .average();
        tickets.put("avgResolutionHours", avgResTime.isPresent() ? Math.round(avgResTime.getAsDouble()) : 0);

        // Open tickets count for quick stat
        tickets.put("openCount", ticketsByStatus.getOrDefault("OPEN", 0L));

        // Ticket trend (last 7 days)
        List<Map<String, Object>> ticketTrend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            long count = allTickets.stream()
                    .filter(t -> t.getCreatedAt() != null
                            && t.getCreatedAt().toLocalDate().equals(date))
                    .count();
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", date.toString());
            day.put("count", count);
            ticketTrend.add(day);
        }
        tickets.put("trend", ticketTrend);

        analytics.put("tickets", tickets);

        // ── Resources ───────────────────────────────── (allResources already fetched above)
        Map<String, Object> resources = new LinkedHashMap<>();
        resources.put("total", allResources.size());

        Map<String, Long> resourcesByStatus = allResources.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getStatus() != null ? r.getStatus().name() : "UNKNOWN",
                        Collectors.counting()));
        resources.put("byStatus", resourcesByStatus);

        Map<String, Long> resourcesByCategory = allResources.stream()
                .filter(r -> r.getCategory() != null)
                .collect(Collectors.groupingBy(Resource::getCategory, Collectors.counting()));
        resources.put("byCategory", resourcesByCategory);

        Map<String, Long> resourcesByBuilding = allResources.stream()
                .filter(r -> r.getBuilding() != null)
                .collect(Collectors.groupingBy(Resource::getBuilding, Collectors.counting()));
        resources.put("byBuilding", resourcesByBuilding);

        // Utilization = active resources / total
        long activeResources = resourcesByStatus.getOrDefault("ACTIVE", 0L);
        resources.put("utilizationRate", allResources.size() > 0
                ? Math.round((activeResources * 100.0) / allResources.size()) : 0);

        analytics.put("resources", resources);

        return ResponseEntity.ok(analytics);
    }
}
