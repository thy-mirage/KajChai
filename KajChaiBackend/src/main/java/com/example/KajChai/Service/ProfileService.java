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

import java.util.Optional;

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
                .city(customer.getCity())
                .upazila(customer.getUpazila())
                .district(customer.getDistrict())
                .division(customer.getDivision())
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
                .city(worker.getCity())
                .upazila(worker.getUpazila())
                .district(worker.getDistrict())
                .division(worker.getDivision())
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
        customer.setPhoto(request.getPhoto());
        customer.setPhone(request.getPhone());
        customer.setGender(request.getGender());
        customer.setCity(request.getCity());
        customer.setUpazila(request.getUpazila());
        customer.setDistrict(request.getDistrict());
        customer.setDivision(request.getDivision());
        
        Customer updatedCustomer = customerRepository.save(customer);
        
        return CustomerProfileResponse.builder()
                .customerId(updatedCustomer.getCustomerId())
                .customerName(updatedCustomer.getCustomerName())
                .photo(updatedCustomer.getPhoto())
                .gmail(updatedCustomer.getGmail())
                .phone(updatedCustomer.getPhone())
                .gender(updatedCustomer.getGender())
                .city(updatedCustomer.getCity())
                .upazila(updatedCustomer.getUpazila())
                .district(updatedCustomer.getDistrict())
                .division(updatedCustomer.getDivision())
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
        worker.setPhoto(request.getPhoto());
        worker.setPhone(request.getPhone());
        worker.setGender(request.getGender());
        worker.setCity(request.getCity());
        worker.setUpazila(request.getUpazila());
        worker.setDistrict(request.getDistrict());
        worker.setDivision(request.getDivision());
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
                .city(updatedWorker.getCity())
                .upazila(updatedWorker.getUpazila())
                .district(updatedWorker.getDistrict())
                .division(updatedWorker.getDivision())
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
}
