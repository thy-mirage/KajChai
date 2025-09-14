package com.example.KajChai.Service;

import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.User;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.DTO.CustomerProfileResponse;
import com.example.KajChai.DTO.CustomerProfileUpdateRequest;
import com.example.KajChai.DTO.WorkerProfileResponse;
import com.example.KajChai.DTO.WorkerProfileUpdateRequest;
import com.example.KajChai.Enum.UserRole;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.WorkerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerProfileResponse getCustomerProfile(String email) {
        Optional<Customer> customerOpt = customerRepository.findByGmail(email);
        if (customerOpt.isEmpty()) {
            throw new RuntimeException("Customer profile not found");
        }
        
        Customer customer = customerOpt.get();
        return CustomerProfileResponse.builder()
                .customerId(customer.getCustomerId())
                .customerName(customer.getCustomerName())
                .photo(customer.getPhoto())
                .gmail(customer.getGmail())
                .phone(customer.getPhone())
                .gender(customer.getGender())
                .latitude(customer.getLatitude())
                .longitude(customer.getLongitude())
                .city(customer.getCity())
                .upazila(customer.getUpazila())
                .district(customer.getDistrict())
                .fullAddress(customer.getFullAddress())
                .build();
    }

    public WorkerProfileResponse getWorkerProfile(String email) {
        Optional<Worker> workerOpt = workerRepository.findByGmail(email);
        if (workerOpt.isEmpty()) {
            throw new RuntimeException("Worker profile not found");
        }
        
        Worker worker = workerOpt.get();
        return WorkerProfileResponse.builder()
                .workerId(worker.getWorkerId())
                .name(worker.getName())
                .photo(worker.getPhoto())
                .gmail(worker.getGmail())
                .phone(worker.getPhone())
                .gender(worker.getGender())
                .latitude(worker.getLatitude())
                .longitude(worker.getLongitude())
                .city(worker.getCity())
                .upazila(worker.getUpazila())
                .district(worker.getDistrict())
                .fullAddress(worker.getFullAddress())
                .field(worker.getField())
                .rating(worker.getRating())
                .experience(worker.getExperience())
                .build();
    }

    @Transactional
    public CustomerProfileResponse updateCustomerProfile(String email, CustomerProfileUpdateRequest request) {
        Optional<Customer> customerOpt = customerRepository.findByGmail(email);
        if (customerOpt.isEmpty()) {
            throw new RuntimeException("Customer profile not found");
        }
        
        Customer customer = customerOpt.get();
        customer.setCustomerName(request.getCustomerName());
        // Only update photo if a new photo URL is provided
        if (request.getPhoto() != null) {
            customer.setPhoto(request.getPhoto());
        }
        customer.setPhone(request.getPhone());
        customer.setGender(request.getGender());
        
        // Update location data
        customer.setLatitude(request.getLatitude());
        customer.setLongitude(request.getLongitude());
        customer.setCity(request.getCity());
        customer.setUpazila(request.getUpazila());
        customer.setDistrict(request.getDistrict());
        
        // Update full address if provided
        if (request.getFullAddress() != null) {
            customer.setFullAddress(request.getFullAddress());
        }
        
        Customer updatedCustomer = customerRepository.save(customer);
        
        return CustomerProfileResponse.builder()
                .customerId(updatedCustomer.getCustomerId())
                .customerName(updatedCustomer.getCustomerName())
                .photo(updatedCustomer.getPhoto())
                .gmail(updatedCustomer.getGmail())
                .phone(updatedCustomer.getPhone())
                .gender(updatedCustomer.getGender())
                .latitude(updatedCustomer.getLatitude())
                .longitude(updatedCustomer.getLongitude())
                .city(updatedCustomer.getCity())
                .upazila(updatedCustomer.getUpazila())
                .district(updatedCustomer.getDistrict())
                .fullAddress(updatedCustomer.getFullAddress())
                .build();
    }

    @Transactional
    public WorkerProfileResponse updateWorkerProfile(String email, WorkerProfileUpdateRequest request) {
        Optional<Worker> workerOpt = workerRepository.findByGmail(email);
        if (workerOpt.isEmpty()) {
            throw new RuntimeException("Worker profile not found");
        }
        
        Worker worker = workerOpt.get();
        worker.setName(request.getName());
        // Only update photo if a new photo URL is provided
        if (request.getPhoto() != null) {
            worker.setPhoto(request.getPhoto());
        }
        worker.setPhone(request.getPhone());
        worker.setGender(request.getGender());
        
        // Update location data
        worker.setLatitude(request.getLatitude());
        worker.setLongitude(request.getLongitude());
        worker.setCity(request.getCity());
        worker.setUpazila(request.getUpazila());
        worker.setDistrict(request.getDistrict());
        
        // Update full address if provided
        if (request.getFullAddress() != null) {
            worker.setFullAddress(request.getFullAddress());
        }
        
        worker.setField(request.getField());
        if (request.getExperience() != null) {
            worker.setExperience(request.getExperience());
        }
        
        Worker updatedWorker = workerRepository.save(worker);
        
        return WorkerProfileResponse.builder()
                .workerId(updatedWorker.getWorkerId())
                .name(updatedWorker.getName())
                .photo(updatedWorker.getPhoto())
                .gmail(updatedWorker.getGmail())
                .phone(updatedWorker.getPhone())
                .gender(updatedWorker.getGender())
                .latitude(updatedWorker.getLatitude())
                .longitude(updatedWorker.getLongitude())
                .city(updatedWorker.getCity())
                .upazila(updatedWorker.getUpazila())
                .district(updatedWorker.getDistrict())
                .fullAddress(updatedWorker.getFullAddress())
                .field(updatedWorker.getField())
                .rating(updatedWorker.getRating())
                .experience(updatedWorker.getExperience())
                .build();
    }

    public Object getProfile(User user) {
        if (user.getRole() == UserRole.CUSTOMER) {
            return getCustomerProfile(user.getEmail());
        } else if (user.getRole() == UserRole.WORKER) {
            return getWorkerProfile(user.getEmail());
        } else {
            throw new RuntimeException("Invalid user role");
        }
    }

    public List<WorkerProfileResponse> getAllWorkers(String field) {
        List<Worker> workers;
        if (field != null && !field.isEmpty()) {
            workers = workerRepository.findByFieldIgnoreCase(field);
        } else {
            workers = workerRepository.findAll();
        }

        return workers.stream()
                .map(this::convertWorkerToResponse)
                .toList();
    }

    public List<WorkerProfileResponse> sortWorkersByLocationForCustomer(List<WorkerProfileResponse> workers, String customerEmail) {
        Optional<Customer> customerOpt = customerRepository.findByGmail(customerEmail);
        if (customerOpt.isEmpty()) {
            throw new RuntimeException("Customer not found");
        }

        Customer customer = customerOpt.get();
        double customerLat = customer.getLatitude();
        double customerLon = customer.getLongitude();

        return workers.stream()
                .sorted(Comparator.comparingDouble(worker -> 
                    calculateDistance(customerLat, customerLon, worker.getLatitude(), worker.getLongitude())))
                .toList();
    }

    private WorkerProfileResponse convertWorkerToResponse(Worker worker) {
        return WorkerProfileResponse.builder()
                .workerId(worker.getWorkerId())
                .name(worker.getName())
                .photo(worker.getPhoto())
                .gmail(worker.getGmail())
                .phone(worker.getPhone())
                .gender(worker.getGender())
                .latitude(worker.getLatitude())
                .longitude(worker.getLongitude())
                .city(worker.getCity())
                .upazila(worker.getUpazila())
                .district(worker.getDistrict())
                .fullAddress(worker.getFullAddress())
                .field(worker.getField())
                .rating(worker.getRating())
                .experience(worker.getExperience())
                .build();
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth's radius in kilometers

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    }
}
