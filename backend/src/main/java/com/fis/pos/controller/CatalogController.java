package com.fis.pos.controller;

import com.fis.pos.api.ApiModels;
import com.fis.pos.security.AuthInterceptor;
import com.fis.pos.service.PosService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CatalogController {
    private final com.fis.pos.repository.PosRepository repository;
    private final PosService service;

    public CatalogController(com.fis.pos.repository.PosRepository repository, PosService service) {
        this.repository = repository;
        this.service = service;
    }

    @GetMapping("/categories")
    public List<ApiModels.CategoryResponse> categories() { return repository.findCategories(); }

    @GetMapping("/products")
    public List<ApiModels.ProductResponse> products(@RequestParam(required = false) Integer categoryId,
                                                     @RequestParam(required = false) String search,
                                                     @RequestParam(required = false) String barcode) {
        return repository.findProducts(categoryId, search, barcode);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiModels.ProductResponse create(@Valid @RequestBody ApiModels.ProductRequest request,
                                             @RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) ApiModels.UserResponse user) {
        service.requireAdmin(user);
        Integer id = repository.insertProduct(request);
        return repository.findProducts(null, null, request.barcode()).stream()
            .filter(product -> product.id().equals(id)).findFirst().orElseThrow();
    }

    @PutMapping("/products/{id}")
    public ApiModels.ProductResponse update(@PathVariable int id, @Valid @RequestBody ApiModels.ProductRequest request,
                                             @RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) ApiModels.UserResponse user) {
        service.requireAdmin(user);
        repository.updateProduct(id, request);
        return repository.findProducts(null, null, request.barcode()).stream()
                .filter(product -> product.id().equals(id)).findFirst().orElseThrow();
    }

    @GetMapping("/inventory/alerts")
    public List<ApiModels.StockAlertResponse> alerts() { return repository.findAlerts(); }
}
