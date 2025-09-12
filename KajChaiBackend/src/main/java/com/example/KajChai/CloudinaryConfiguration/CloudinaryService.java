package com.example.KajChai.CloudinaryConfiguration;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload a single file to Cloudinary
     * @param file MultipartFile to upload
     * @return URL of the uploaded image
     * @throws IOException if upload fails
     */
    public String uploadFile(MultipartFile file) throws IOException {
        return uploadFile(file, "kajchai/general");
    }

    /**
     * Upload a single file to Cloudinary with custom folder
     * @param file MultipartFile to upload
     * @param folder Custom folder path
     * @return URL of the uploaded image
     * @throws IOException if upload fails
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        try {
            // Generate unique public ID for the image
            String publicId = "kajchai_" + UUID.randomUUID().toString();
            
            // Upload options
            Map<String, Object> uploadOptions = ObjectUtils.asMap(
                "public_id", publicId,
                "folder", folder, // Use custom folder
                "resource_type", "auto", // Auto-detect file type
                "quality", "auto:good", // Optimize quality
                "fetch_format", "auto" // Auto-optimize format
            );
            
            // Upload the file
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                file.getBytes(), 
                uploadOptions
            );
            
            // Return the secure URL
            return (String) uploadResult.get("secure_url");
            
        } catch (IOException e) {
            System.err.println("Failed to upload file to Cloudinary: " + e.getMessage());
            throw new IOException("Failed to upload file to Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * Upload multiple files to Cloudinary
     * @param files List of MultipartFiles to upload
     * @return List of URLs of uploaded images
     * @throws IOException if any upload fails
     */
    public List<String> uploadMultipleFiles(List<MultipartFile> files) throws IOException {
        List<String> imageUrls = new ArrayList<>();
        
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                try {
                    String imageUrl = uploadFile(file);
                    imageUrls.add(imageUrl);
                    System.out.println("Successfully uploaded file to Cloudinary: " + imageUrl);
                } catch (IOException e) {
                    System.err.println("Failed to upload file: " + file.getOriginalFilename() + " - " + e.getMessage());
                    // Continue with other files instead of failing completely
                }
            }
        }
        
        return imageUrls;
    }

    /**
     * Delete an image from Cloudinary using its public ID
     * @param publicId The public ID of the image to delete
     * @return true if deletion was successful
     */
    public boolean deleteFile(String publicId) {
        try {
            Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            String resultStatus = (String) result.get("result");
            return "ok".equals(resultStatus);
        } catch (IOException e) {
            System.err.println("Failed to delete file from Cloudinary: " + e.getMessage());
            return false;
        }
    }

    /**
     * Extract public ID from Cloudinary URL for deletion
     * @param cloudinaryUrl The full Cloudinary URL
     * @return The public ID
     */
    public String extractPublicIdFromUrl(String cloudinaryUrl) {
        try {
            // Example URL: https://res.cloudinary.com/dikggnplq/image/upload/v1234567890/kajchai/reviews/kajchai_uuid.jpg
            // We want to extract: kajchai/reviews/kajchai_uuid
            
            String[] parts = cloudinaryUrl.split("/");
            if (parts.length >= 3) {
                // Find the part after "/upload/"
                boolean foundUpload = false;
                StringBuilder publicId = new StringBuilder();
                
                for (int i = 0; i < parts.length; i++) {
                    if ("upload".equals(parts[i]) && i + 1 < parts.length) {
                        foundUpload = true;
                        i++; // Skip version number if present (starts with 'v')
                        if (parts[i].startsWith("v") && i + 1 < parts.length) {
                            i++;
                        }
                        // Collect remaining parts except file extension
                        for (int j = i; j < parts.length; j++) {
                            if (j > i) publicId.append("/");
                            String part = parts[j];
                            // Remove file extension from last part
                            if (j == parts.length - 1 && part.contains(".")) {
                                part = part.substring(0, part.lastIndexOf("."));
                            }
                            publicId.append(part);
                        }
                        break;
                    }
                }
                
                return foundUpload ? publicId.toString() : null;
            }
            return null;
        } catch (Exception e) {
            System.err.println("Failed to extract public ID from URL: " + e.getMessage());
            return null;
        }
    }

    /**
     * Get image info from Cloudinary
     * @param publicId The public ID of the image
     * @return Map containing image information
     */
    public Map<String, Object> getImageInfo(String publicId) {
        try {
            return cloudinary.api().resource(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            System.err.println("Failed to get image info from Cloudinary: " + e.getMessage());
            return null;
        }
    }
}
