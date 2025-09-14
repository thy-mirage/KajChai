package com.example.KajChai.Service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.WorkerRepository;
import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.Worker;

import java.util.Map;
import java.util.HashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {

    private final RestTemplate restTemplate;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Reverse geocode coordinates to get address components using Nominatim API (free)
     * Enhanced with better address parsing for Bangladesh locations
     */
    public Map<String, String> reverseGeocode(double latitude, double longitude) {
        try {
            String url = String.format(
                "https://nominatim.openstreetmap.org/reverse?format=json&lat=%f&lon=%f&addressdetails=1&accept-language=en&zoom=18",
                latitude, longitude
            );
            
            log.debug("Reverse geocoding: {},{}", latitude, longitude);
            
            String response = restTemplate.getForObject(url, String.class);
            JsonNode jsonNode = objectMapper.readTree(response);
            
            Map<String, String> addressComponents = new HashMap<>();
            
            if (jsonNode != null && jsonNode.has("address")) {
                JsonNode address = jsonNode.get("address");
                
                // Extract address components with improved parsing
                String city = extractCity(address);
                String upazila = extractUpazila(address);
                String district = extractDistrict(address);
                String division = extractDivision(address);
                String fullAddress = buildFullAddress(jsonNode, address);
                
                addressComponents.put("city", city);
                addressComponents.put("upazila", upazila);
                addressComponents.put("district", district);
                addressComponents.put("division", division);
                addressComponents.put("fullAddress", fullAddress);
                
                log.info("Reverse geocoded: {},{} -> City: {}, Upazila: {}, District: {}, Division: {}", 
                    latitude, longitude, city, upazila, district, division);
            } else {
                log.warn("No address details found for coordinates: {},{}", latitude, longitude);
                return getDefaultAddressComponents();
            }
            
            return addressComponents;
            
        } catch (Exception e) {
            log.error("Error reverse geocoding coordinates {},{}: {}", latitude, longitude, e.getMessage());
            return getDefaultAddressComponents();
        }
    }

    private String buildFullAddress(JsonNode jsonNode, JsonNode address) {
        StringBuilder fullAddress = new StringBuilder();
        
        // Try to build a more meaningful address
        if (address.has("house_number")) {
            fullAddress.append(address.get("house_number").asText()).append(" ");
        }
        if (address.has("road")) {
            fullAddress.append(address.get("road").asText()).append(", ");
        }
        if (address.has("suburb") || address.has("neighbourhood")) {
            String area = address.has("suburb") ? address.get("suburb").asText() : address.get("neighbourhood").asText();
            fullAddress.append(area).append(", ");
        }
        
        // Add city
        String city = extractCity(address);
        if (!city.equals("Unknown City")) {
            fullAddress.append(city).append(", ");
        }
        
        // Add district
        String district = extractDistrict(address);
        if (!district.equals("Unknown District")) {
            fullAddress.append(district).append(", ");
        }
        
        // Add country
        if (address.has("country")) {
            fullAddress.append(address.get("country").asText());
        }
        
        // Fallback to display_name if our built address is too short
        String builtAddress = fullAddress.toString().trim().replaceAll(",$", "");
        if (builtAddress.length() < 10 && jsonNode.has("display_name")) {
            return jsonNode.get("display_name").asText();
        }
        
        return builtAddress.isEmpty() ? "Address not available" : builtAddress;
    }

    /**
     * Forward geocode address to get coordinates using Nominatim API (free)
     * Enhanced with multiple search strategies for better results
     */
    public Map<String, Double> geocodeAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            log.warn("Empty address provided for geocoding");
            return new HashMap<>();
        }

        try {
            // Strategy 1: Search as-is
            Map<String, Double> result = searchAddress(address);
            if (!result.isEmpty()) {
                return result;
            }

            // Strategy 2: Search with "Bangladesh" appended
            result = searchAddress(address + ", Bangladesh");
            if (!result.isEmpty()) {
                return result;
            }

            // Strategy 3: Search with "Dhaka, Bangladesh" appended (assuming most searches are in Dhaka)
            result = searchAddress(address + ", Dhaka, Bangladesh");
            if (!result.isEmpty()) {
                return result;
            }

            // Strategy 4: Try fuzzy search by removing special characters
            String cleanedAddress = address.replaceAll("[^a-zA-Z0-9\\s]", "").trim();
            if (!cleanedAddress.equals(address)) {
                result = searchAddress(cleanedAddress + ", Bangladesh");
                if (!result.isEmpty()) {
                    return result;
                }
            }

            log.warn("No results found for address: '{}'", address);
            return new HashMap<>();

        } catch (Exception e) {
            log.error("Error geocoding address '{}': {}", address, e.getMessage());
            return new HashMap<>();
        }
    }

    private Map<String, Double> searchAddress(String searchQuery) {
        try {
            String url = String.format(
                "https://nominatim.openstreetmap.org/search?format=json&q=%s&limit=5&countrycodes=bd&addressdetails=1&accept-language=en",
                searchQuery.replace(" ", "%20")
            );
            
            log.debug("Searching with query: '{}'", searchQuery);
            
            String response = restTemplate.getForObject(url, String.class);
            JsonNode jsonArray = objectMapper.readTree(response);
            
            Map<String, Double> coordinates = new HashMap<>();
            
            if (jsonArray != null && jsonArray.isArray() && jsonArray.size() > 0) {
                // Get the first (best) result
                JsonNode firstResult = jsonArray.get(0);
                double lat = firstResult.get("lat").asDouble();
                double lon = firstResult.get("lon").asDouble();
                
                coordinates.put("latitude", lat);
                coordinates.put("longitude", lon);
                
                log.info("Geocoded address '{}' -> {},{}", searchQuery, lat, lon);
                
                // Log additional results for debugging
                if (jsonArray.size() > 1) {
                    log.debug("Found {} total results for '{}'", jsonArray.size(), searchQuery);
                }
            } else {
                log.debug("No results found for query: '{}'", searchQuery);
            }
            
            return coordinates;
            
        } catch (Exception e) {
            log.error("Error searching address '{}': {}", searchQuery, e.getMessage());
            return new HashMap<>();
        }
    }

    /**
     * Calculate distance between two points using Haversine formula
     * Returns distance in kilometers
     */
    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the Earth in kilometers

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c; // Distance in kilometers
    }

    private String extractCity(JsonNode address) {
        String city = null;
        
        // Try different possible fields for city (prioritized for Bangladesh)
        if (address.has("city")) {
            city = address.get("city").asText();
        } else if (address.has("town")) {
            city = address.get("town").asText();
        } else if (address.has("village")) {
            city = address.get("village").asText();
        } else if (address.has("municipality")) {
            city = address.get("municipality").asText();
        } else if (address.has("hamlet")) {
            city = address.get("hamlet").asText();
        } else if (address.has("suburb")) {
            city = address.get("suburb").asText();
        } else if (address.has("neighbourhood")) {
            city = address.get("neighbourhood").asText();
        }
        
        // Clean up and capitalize city name
        if (city != null && !city.trim().isEmpty()) {
            return capitalizeWords(city.trim());
        }
        
        return "Unknown City";
    }

    private String extractUpazila(JsonNode address) {
        String upazila = null;
        
        // Try different possible fields for upazila/ward/corporation
        if (address.has("county")) {
            upazila = address.get("county").asText(); // Often maps to upazila in Bangladesh
        } else if (address.has("suburb")) {
            upazila = address.get("suburb").asText();
        } else if (address.has("neighbourhood")) {
            upazila = address.get("neighbourhood").asText();
        } else if (address.has("quarter")) {
            upazila = address.get("quarter").asText();
        } else if (address.has("city_district")) {
            upazila = address.get("city_district").asText();
        } else if (address.has("municipality")) {
            upazila = address.get("municipality").asText();
        } else if (address.has("subdistrict")) {
            upazila = address.get("subdistrict").asText();
        }
        
        // Clean up and capitalize upazila name
        if (upazila != null && !upazila.trim().isEmpty()) {
            return capitalizeWords(upazila.trim());
        }
        
        return "Unknown Area";
    }

    private String extractDistrict(JsonNode address) {
        String district = null;
        
        // Try different possible fields for district
        if (address.has("state_district")) {
            district = address.get("state_district").asText();
        } else if (address.has("region")) {
            district = address.get("region").asText();
        } else if (address.has("state")) {
            // In Bangladesh, sometimes the district is in the 'state' field
            String state = address.get("state").asText();
            // Check if it looks like a district (ends with common district suffixes)
            if (state.toLowerCase().contains("district") || 
                state.toLowerCase().endsWith("zila") ||
                isKnownBangladeshiDistrict(state)) {
                district = state;
            }
        }
        
        // Clean up district name - remove "District" suffix if present
        if (district != null) {
            district = cleanDistrictName(district);
            return district;
        }
        
        return "Unknown District";
    }

    private String extractDivision(JsonNode address) {
        String division = null;
        
        // Try different possible fields for division/state
        if (address.has("state")) {
            String state = address.get("state").asText();
            // If it's not a district, it might be a division
            if (!state.toLowerCase().contains("district") && 
                !state.toLowerCase().endsWith("zila") &&
                !isKnownBangladeshiDistrict(state)) {
                division = state;
            }
        } else if (address.has("province")) {
            division = address.get("province").asText();
        } else if (address.has("region")) {
            String region = address.get("region").asText();
            // Only use region as division if it's not already used as district
            if (!region.equals(extractDistrict(address))) {
                division = region;
            }
        }
        
        // Clean up and capitalize division name
        if (division != null && !division.trim().isEmpty()) {
            return capitalizeWords(division.trim());
        }
        
        return "Unknown Division";
    }

    private boolean isKnownBangladeshiDistrict(String name) {
        // Common Bangladeshi districts for better classification
        String[] districts = {
            "Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Barisal", "Rangpur",
            "Comilla", "Narayanganj", "Gazipur", "Tangail", "Mymensingh", "Kishoreganj",
            "Narsingdi", "Munshiganj", "Manikganj", "Faridpur", "Gopalganj", "Madaripur",
            "Shariatpur", "Rajbari", "Cox's Bazar", "Feni", "Lakshmipur", "Noakhali",
            "Brahmanbaria", "Chandpur", "Habiganj", "Moulvibazar", "Sunamganj",
            "Bogra", "Joypurhat", "Naogaon", "Natore", "Nawabganj", "Pabna", "Sirajganj",
            "Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Kushtia", "Magura", "Meherpur",
            "Narail", "Satkhira", "Barguna", "Barisal", "Bhola", "Jhalokati", "Patuakhali",
            "Pirojpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari",
            "Panchagarh", "Rangpur", "Thakurgaon", "Jamalpur", "Mymensingh", "Netrakona", "Sherpur"
        };
        
        for (String district : districts) {
            if (name.toLowerCase().contains(district.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Clean up district name by removing common suffixes like "District"
     */
    private String cleanDistrictName(String districtName) {
        if (districtName == null || districtName.trim().isEmpty()) {
            return districtName;
        }
        
        String cleaned = districtName.trim();
        
        // Remove "District" suffix (case-insensitive)
        if (cleaned.toLowerCase().endsWith(" district")) {
            cleaned = cleaned.substring(0, cleaned.length() - 9).trim();
        }
        
        // Remove "Zila" suffix (case-insensitive)
        if (cleaned.toLowerCase().endsWith(" zila")) {
            cleaned = cleaned.substring(0, cleaned.length() - 5).trim();
        }
        
        // Capitalize first letter of each word
        return capitalizeWords(cleaned);
    }

    /**
     * Capitalize the first letter of each word
     */
    private String capitalizeWords(String input) {
        if (input == null || input.trim().isEmpty()) {
            return input;
        }
        
        String[] words = input.trim().split("\\s+");
        StringBuilder result = new StringBuilder();
        
        for (int i = 0; i < words.length; i++) {
            if (i > 0) {
                result.append(" ");
            }
            
            String word = words[i];
            if (word.length() > 0) {
                result.append(Character.toUpperCase(word.charAt(0)));
                if (word.length() > 1) {
                    result.append(word.substring(1).toLowerCase());
                }
            }
        }
        
        return result.toString();
    }

    private Map<String, String> getDefaultAddressComponents() {
        Map<String, String> defaults = new HashMap<>();
        defaults.put("city", "Unknown City");
        defaults.put("upazila", "Unknown Area");
        defaults.put("district", "Unknown District");
        defaults.put("fullAddress", "Address not available");
        return defaults;
    }

    /**
     * Populate location data for existing users who don't have coordinates
     * Uses their existing city/district info to get approximate coordinates
     */
    public void populateExistingUsersLocation() {
        log.info("Starting to populate location data for existing users...");
        
        // Update customers without location data
        List<Customer> customersWithoutLocation = customerRepository.findAll().stream()
            .filter(customer -> customer.getLatitude() == null || customer.getLongitude() == null)
            .toList();
        
        log.info("Found {} customers without location data", customersWithoutLocation.size());
        
        for (Customer customer : customersWithoutLocation) {
            try {
                // Build search query from existing address components
                String searchQuery = buildSearchQuery(customer.getCity(), customer.getUpazila(), customer.getDistrict());
                
                if (searchQuery != null && !searchQuery.trim().isEmpty()) {
                    log.debug("Geocoding for customer {}: {}", customer.getCustomerId(), searchQuery);
                    
                    Map<String, Double> coordinates = geocodeAddress(searchQuery);
                    
                    if (coordinates != null && !coordinates.isEmpty() && 
                        coordinates.containsKey("latitude") && coordinates.containsKey("longitude")) {
                        
                        customer.setLatitude(coordinates.get("latitude"));
                        customer.setLongitude(coordinates.get("longitude"));
                        
                        // Get detailed address info using reverse geocoding
                        try {
                            Map<String, String> addressInfo = reverseGeocode(
                                coordinates.get("latitude"), coordinates.get("longitude")
                            );
                            
                            if (addressInfo != null) {
                                // Update address components if they're better than existing ones
                                if (addressInfo.get("city") != null && !addressInfo.get("city").equals("Unknown City")) {
                                    customer.setCity(addressInfo.get("city"));
                                }
                                if (addressInfo.get("upazila") != null && !addressInfo.get("upazila").equals("Unknown Area")) {
                                    customer.setUpazila(addressInfo.get("upazila"));
                                }
                                if (addressInfo.get("district") != null && !addressInfo.get("district").equals("Unknown District")) {
                                    customer.setDistrict(addressInfo.get("district"));
                                }
                                if (addressInfo.get("fullAddress") != null) {
                                    customer.setFullAddress(addressInfo.get("fullAddress"));
                                }
                            }
                        } catch (Exception e) {
                            log.warn("Error getting detailed address for customer {}: {}", customer.getCustomerId(), e.getMessage());
                        }
                        
                        customerRepository.save(customer);
                        log.debug("Updated location for customer {}", customer.getCustomerId());
                    } else {
                        log.warn("Could not geocode location for customer {}: {}", customer.getCustomerId(), searchQuery);
                    }
                } else {
                    log.warn("Insufficient address data for customer {}", customer.getCustomerId());
                }
            } catch (Exception e) {
                log.error("Error updating location for customer {}: {}", customer.getCustomerId(), e.getMessage());
            }
        }
        
        // Update workers without location data
        List<Worker> workersWithoutLocation = workerRepository.findAll().stream()
            .filter(worker -> worker.getLatitude() == null || worker.getLongitude() == null)
            .toList();
        
        log.info("Found {} workers without location data", workersWithoutLocation.size());
        
        for (Worker worker : workersWithoutLocation) {
            try {
                // Build search query from existing address components
                String searchQuery = buildSearchQuery(worker.getCity(), worker.getUpazila(), worker.getDistrict());
                
                if (searchQuery != null && !searchQuery.trim().isEmpty()) {
                    log.debug("Geocoding for worker {}: {}", worker.getWorkerId(), searchQuery);
                    
                    Map<String, Double> coordinates = geocodeAddress(searchQuery);
                    
                    if (coordinates != null && !coordinates.isEmpty() && 
                        coordinates.containsKey("latitude") && coordinates.containsKey("longitude")) {
                        
                        worker.setLatitude(coordinates.get("latitude"));
                        worker.setLongitude(coordinates.get("longitude"));
                        
                        // Get detailed address info using reverse geocoding
                        try {
                            Map<String, String> addressInfo = reverseGeocode(
                                coordinates.get("latitude"), coordinates.get("longitude")
                            );
                            
                            if (addressInfo != null) {
                                // Update address components if they're better than existing ones
                                if (addressInfo.get("city") != null && !addressInfo.get("city").equals("Unknown City")) {
                                    worker.setCity(addressInfo.get("city"));
                                }
                                if (addressInfo.get("upazila") != null && !addressInfo.get("upazila").equals("Unknown Area")) {
                                    worker.setUpazila(addressInfo.get("upazila"));
                                }
                                if (addressInfo.get("district") != null && !addressInfo.get("district").equals("Unknown District")) {
                                    worker.setDistrict(addressInfo.get("district"));
                                }
                                if (addressInfo.get("fullAddress") != null) {
                                    worker.setFullAddress(addressInfo.get("fullAddress"));
                                }
                            }
                        } catch (Exception e) {
                            log.warn("Error getting detailed address for worker {}: {}", worker.getWorkerId(), e.getMessage());
                        }
                        
                        workerRepository.save(worker);
                        log.debug("Updated location for worker {}", worker.getWorkerId());
                    } else {
                        log.warn("Could not geocode location for worker {}: {}", worker.getWorkerId(), searchQuery);
                    }
                } else {
                    log.warn("Insufficient address data for worker {}", worker.getWorkerId());
                }
            } catch (Exception e) {
                log.error("Error updating location for worker {}: {}", worker.getWorkerId(), e.getMessage());
            }
        }
        
        log.info("Completed populating location data for existing users");
    }
    
    /**
     * Build a search query from existing address components
     */
    private String buildSearchQuery(String city, String upazila, String district) {
        StringBuilder query = new StringBuilder();
        
        if (city != null && !city.trim().isEmpty()) {
            query.append(city.trim());
        }
        
        if (upazila != null && !upazila.trim().isEmpty()) {
            if (query.length() > 0) query.append(", ");
            query.append(upazila.trim());
        }
        
        if (district != null && !district.trim().isEmpty()) {
            if (query.length() > 0) query.append(", ");
            query.append(district.trim());
        }
        
        // Always add Bangladesh for better results
        if (query.length() > 0) {
            query.append(", Bangladesh");
        }
        
        return query.toString();
    }
}