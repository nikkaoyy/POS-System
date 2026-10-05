package com.fis.pos.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public final class ApiModels {
    private ApiModels() { }

    public record LoginRequest(@NotBlank String pin) { }
    public record LoginResponse(String token, UserResponse user) { }
    public record UserResponse(Integer id, String name, String role) { }
    public record CategoryResponse(Integer id, String name, String color, String icon,
                                   BigDecimal posX, BigDecimal posZ) { }
    public record ProductResponse(Integer id, String name, Integer categoryId, String category,
                                  BigDecimal price, Integer stock, Integer minStock, String barcode) { }
    public record ProductRequest(@NotBlank String name, @NotNull Integer categoryId,
                                 @NotNull @Min(0) BigDecimal price, @NotNull @Min(0) Integer stock,
                                 @NotNull @Min(0) Integer minStock, @NotBlank String barcode) { }
    public record SaleItemRequest(@NotNull Integer productId, @NotNull @Min(1) Integer qty) { }
    public record SaleRequest(@NotEmpty List<@Valid SaleItemRequest> items,
                              @Min(0) BigDecimal taxRate) { }
    public record SaleItemResponse(Integer productId, String name, Integer qty, BigDecimal price) { }
    public record SaleResponse(Integer id, String folio, OffsetDateTime date, String cashier,
                               BigDecimal subtotal, BigDecimal taxAmount, BigDecimal total,
                               List<SaleItemResponse> items) { }
    public record StockAlertResponse(Integer productId, String name, Integer categoryId,
                                     String categoryName, Integer stock, Integer minStock,
                                     String severity) { }
    public record DashboardResponse(BigDecimal totalRevenue, long totalSales, long totalProducts,
                                    long alertCount, long outOfStock) { }
}
