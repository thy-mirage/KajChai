package com.example.KajChai.AwsConfiguration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;


@RestController
@RequestMapping("test")
public class AwsTester {
    @Autowired
    private S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @GetMapping("/s3-health")
    public ResponseEntity<?> checkS3Health() {
        System.out.println("Welcome to S3 Bucket Health Check");
        try {
            s3Client.listObjectsV2(ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .maxKeys(1)
                    .build());

            return ResponseEntity.status(200).body("✅ S3 Connection Successful");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("❌ S3 Connection Failed: " + e.getMessage());
        }
    }
}
