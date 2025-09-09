package com.example.KajChai.AwsConfiguration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

@Service
public class AwsFileUpload {
    private final S3Client s3Client ;

    @Value("${aws.s3.bucket-name}")
    private String bucketName ;

    public AwsFileUpload(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public String uploadFile(MultipartFile file){
        String fileExtension  = file.getOriginalFilename().substring( file.getOriginalFilename().lastIndexOf(".")+1 ) ;
        String key = UUID.randomUUID().toString() + "." + fileExtension ;
        bucketName = bucketName.trim();
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.getContentType())
                .build();

        try{
            PutObjectResponse response = s3Client.putObject(putObjectRequest , RequestBody.fromBytes( file.getBytes() ));
            if( response.sdkHttpResponse().isSuccessful() ) {
                return "https://" + bucketName + ".s3.amazonaws.com/" + key;
            }
        }catch (Exception exception){
            System.out.println(exception.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR , "An error occured when uploading file...");
        }
        return null;
    }

    public void deleteFile(String fileUrl) {
        try {
            String key = extractKeyFromUrl(fileUrl);
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteRequest);
        } catch (Exception e) {
            System.out.println("Failed to delete file: " + e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete previous image from S3.");
        }
    }

    private String extractKeyFromUrl(String fileUrl) {
        return fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
    }

    public List<String> uploadMultipleFiles(List<MultipartFile> files) throws Exception {
        List<String> urls = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String fileExtension = file.getOriginalFilename().substring(
                    file.getOriginalFilename().lastIndexOf(".") + 1
            );
            String key = UUID.randomUUID().toString() + "." + fileExtension;

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName.trim())
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            try {
                PutObjectResponse response = s3Client.putObject(
                        putObjectRequest,
                        RequestBody.fromBytes(file.getBytes())
                );

                if (response.sdkHttpResponse().isSuccessful()) {
                    urls.add("https://" + bucketName + ".s3.amazonaws.com/" + key);
                }
            } catch (Exception e) {
                // Delete any already uploaded files if one fails
                for (String url : urls) {
                    deleteFile(url);
                }
                throw new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Failed to upload files: " + e.getMessage()
                );
            }
        }

        return urls;
    }
}
