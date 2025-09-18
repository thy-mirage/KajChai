package com.example.KajChai.Controller;

import com.example.KajChai.DTO.LocationRequest;
import com.example.KajChai.DTO.LocationResponse;
import com.example.KajChai.Service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
@CrossOrigin(origins = {
    "http://localhost:5173", 
    "http://localhost:5174", 
    "https://kaj-chai.vercel.app",
    "https://*.vercel.app"
}, allowCredentials = "true")
public class LocationController {

    private final LocationService locationService;

    @PostMapping("/reverse-geocode")
    public ResponseEntity<Map<String, Object>> reverseGeocode(@RequestBody LocationRequest request) {
        try {
            Map<String, String> addressComponents = locationService.reverseGeocode(
                request.getLatitude(), request.getLongitude()
            );

            LocationResponse locationResponse = LocationResponse.builder()
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .city(addressComponents.get("city"))
                .upazila(addressComponents.get("upazila"))
                .district(addressComponents.get("district"))
                .fullAddress(addressComponents.get("fullAddress"))
                .build();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", locationResponse);
            response.put("message", "Location geocoded successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to geocode location: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/geocode")
    public ResponseEntity<Map<String, Object>> geocodeAddress(@RequestParam String address) {
        try {
            Map<String, Double> coordinates = locationService.geocodeAddress(address);

            if (coordinates.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Address not found");
                return ResponseEntity.badRequest().body(response);
            }

            LocationResponse locationResponse = LocationResponse.builder()
                .latitude(coordinates.get("latitude"))
                .longitude(coordinates.get("longitude"))
                .build();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", locationResponse);
            response.put("message", "Address geocoded successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to geocode address: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/distance")
    public ResponseEntity<Map<String, Object>> calculateDistance(
            @RequestParam Double lat1, @RequestParam Double lon1,
            @RequestParam Double lat2, @RequestParam Double lon2) {
        try {
            double distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("distance", distance);
            response.put("unit", "kilometers");
            response.put("message", "Distance calculated successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to calculate distance: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}