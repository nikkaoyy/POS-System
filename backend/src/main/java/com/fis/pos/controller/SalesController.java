package com.fis.pos.controller;

import com.fis.pos.api.ApiModels;
import com.fis.pos.repository.PosRepository;
import com.fis.pos.security.AuthInterceptor;
import com.fis.pos.service.PosService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class SalesController {
    private final PosRepository repository;
    private final PosService service;

    public SalesController(PosRepository repository, PosService service) {
        this.repository = repository;
        this.service = service;
    }

    @GetMapping("/sales")
    public List<ApiModels.SaleResponse> sales() { return repository.findSales(); }

    @PostMapping("/sales")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiModels.SaleResponse create(@Valid @RequestBody ApiModels.SaleRequest request,
                                          @RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) ApiModels.UserResponse user) {
        return service.createSale(user, request);
    }

    @GetMapping("/dashboard")
    public ApiModels.DashboardResponse dashboard() { return repository.dashboard(); }
}
