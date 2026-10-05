package com.fis.pos.service;

import com.fis.pos.api.ApiModels;
import com.fis.pos.repository.PosRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;

@Service
public class PosService {
    private final PosRepository repository;
    private final BigDecimal defaultTaxRate;

    public PosService(PosRepository repository, @Value("${app.tax-rate}") BigDecimal defaultTaxRate) {
        this.repository = repository;
        this.defaultTaxRate = defaultTaxRate;
    }

    @Transactional
    public ApiModels.SaleResponse createSale(ApiModels.UserResponse user, ApiModels.SaleRequest request) {
        if (request.items().stream().map(ApiModels.SaleItemRequest::productId).collect(java.util.stream.Collectors.toSet()).size()
                != request.items().size()) {
            throw new IllegalArgumentException("No se puede repetir un producto en la venta");
        }
        List<Integer> stocks = repository.lockProducts(request.items());
        for (int index = 0; index < stocks.size(); index++) {
            if (stocks.get(index) < request.items().get(index).qty()) {
                throw new IllegalArgumentException("Stock insuficiente para el producto "
                        + request.items().get(index).productId());
            }
        }
        BigDecimal taxRate = request.taxRate() == null ? defaultTaxRate : request.taxRate();
        repository.insertSale(user.id(), taxRate);
        int saleId = repository.latestSaleId();
        for (ApiModels.SaleItemRequest item : request.items()) {
            repository.insertSaleItem(saleId, item, repository.productPrice(item.productId()));
        }
        return repository.findSale(saleId);
    }

    public void requireAdmin(ApiModels.UserResponse user) {
        if (!"ADMIN".equals(user.role())) throw new IllegalArgumentException("Se requiere rol ADMIN");
    }
}
