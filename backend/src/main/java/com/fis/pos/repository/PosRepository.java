package com.fis.pos.repository;

import com.fis.pos.api.ApiModels;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public class PosRepository {
    private final JdbcTemplate jdbc;

    public PosRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public ApiModels.UserResponse findUserByPin(String pin) {
        List<ApiModels.UserResponse> users = jdbc.query("""
                select u.user_id, u.full_name, r.role_name
                from app_user u join app_role r on r.role_id = u.role_id
                where u.is_active and u.pin_hash = encode(extensions.digest(?, 'sha256'), 'hex')
                """, (rs, row) -> new ApiModels.UserResponse(
                rs.getInt("user_id"), rs.getString("full_name"), rs.getString("role_name")), pin);
        return users.stream().findFirst().orElse(null);
    }

    public List<ApiModels.CategoryResponse> findCategories() {
        return jdbc.query("""
                select c.category_id, c.name, c.color_hex, c.icon_name, a.pos_x, a.pos_z
                from category c left join aisle a on a.category_id = c.category_id
                order by c.category_id
                """, (rs, row) -> new ApiModels.CategoryResponse(
                rs.getInt("category_id"), rs.getString("name"), rs.getString("color_hex"),
                rs.getString("icon_name"), rs.getBigDecimal("pos_x"), rs.getBigDecimal("pos_z")));
    }

    public List<ApiModels.ProductResponse> findProducts(Integer categoryId, String search, String barcode) {
        return jdbc.query("""
                select p.product_id, p.name, p.category_id, c.name category_name,
                       p.unit_price, p.stock_qty, p.min_stock, pb.barcode
                from product p join category c on c.category_id = p.category_id
                left join product_barcode pb on pb.product_id = p.product_id
                where p.is_active
                  and (? is null or p.category_id = ?)
                  and (? is null or lower(p.name) like lower('%' || ? || '%'))
                  and (? is null or pb.barcode = ?)
                order by p.product_id
                """, (rs, row) -> product(rs), categoryId, categoryId, search, search, barcode, barcode);
    }

    public Integer insertProduct(ApiModels.ProductRequest request) {
        Integer id = jdbc.queryForObject("""
                insert into product (category_id, name, unit_price, stock_qty, min_stock)
                values (?, ?, ?, ?, ?) returning product_id
                """, Integer.class, request.categoryId(), request.name(), request.price(),
                request.stock(), request.minStock());
        jdbc.update("insert into product_barcode (barcode, product_id) values (?, ?)", request.barcode(), id);
        return id;
    }

    public void updateProduct(int id, ApiModels.ProductRequest request) {
        int updated = jdbc.update("""
                update product set category_id = ?, name = ?, unit_price = ?, stock_qty = ?, min_stock = ?
                where product_id = ? and is_active
                """, request.categoryId(), request.name(), request.price(), request.stock(),
                request.minStock(), id);
        if (updated == 0) throw new IllegalArgumentException("Producto no encontrado");
        jdbc.update("delete from product_barcode where product_id = ?", id);
        jdbc.update("insert into product_barcode (barcode, product_id) values (?, ?)", request.barcode(), id);
    }

    public List<ApiModels.StockAlertResponse> findAlerts() {
        return jdbc.query("""
                select product_id, name, category_id, category_name, stock_qty, min_stock, severity
                from v_stock_alert
                order by case severity when 'critical' then 0 when 'warning' then 1 else 2 end, name
                """, (rs, row) -> new ApiModels.StockAlertResponse(rs.getInt("product_id"),
                rs.getString("name"), rs.getInt("category_id"), rs.getString("category_name"),
                rs.getInt("stock_qty"), rs.getInt("min_stock"), rs.getString("severity")));
    }

    public List<Integer> lockProducts(List<ApiModels.SaleItemRequest> items) {
        return items.stream().map(item -> jdbc.queryForObject(
                "select stock_qty from product where product_id = ? and is_active for update",
                Integer.class, item.productId())).toList();
    }

    public void insertSale(int userId, BigDecimal taxRate) {
        jdbc.update("insert into sale (user_id, tax_rate) values (?, ?)", userId, taxRate);
    }

    public int latestSaleId() {
        return jdbc.queryForObject("select currval(pg_get_serial_sequence('sale', 'sale_id'))", Integer.class);
    }

    public void insertSaleItem(int saleId, ApiModels.SaleItemRequest item, BigDecimal price) {
        jdbc.update("insert into sale_item (sale_id, product_id, qty, unit_price) values (?, ?, ?, ?)",
                saleId, item.productId(), item.qty(), price);
        jdbc.update("update product set stock_qty = stock_qty - ? where product_id = ?",
                item.qty(), item.productId());
    }

    public BigDecimal productPrice(int productId) {
        return jdbc.queryForObject("select unit_price from product where product_id = ? and is_active",
                BigDecimal.class, productId);
    }

    public ApiModels.SaleResponse findSale(int saleId) {
        ApiModels.SaleResponse summary = jdbc.queryForObject("""
                select sale_id, folio, sale_date, cashier_name, subtotal, tax_amount, total
                from v_sale_totals where sale_id = ?
                """, (rs, row) -> new ApiModels.SaleResponse(rs.getInt("sale_id"),
                rs.getString("folio"), rs.getObject("sale_date", OffsetDateTime.class),
                rs.getString("cashier_name"), rs.getBigDecimal("subtotal"),
                rs.getBigDecimal("tax_amount"), rs.getBigDecimal("total"), List.of()), saleId);
        List<ApiModels.SaleItemResponse> items = jdbc.query("""
                select i.product_id, p.name, i.qty, i.unit_price
                from sale_item i join product p on p.product_id = i.product_id where i.sale_id = ?
                order by i.product_id
                """, (rs, row) -> new ApiModels.SaleItemResponse(rs.getInt("product_id"),
                rs.getString("name"), rs.getInt("qty"), rs.getBigDecimal("unit_price")), saleId);
        return new ApiModels.SaleResponse(summary.id(), summary.folio(), summary.date(), summary.cashier(),
                summary.subtotal(), summary.taxAmount(), summary.total(), items);
    }

    public List<ApiModels.SaleResponse> findSales() {
        return jdbc.query("select sale_id from v_sale_totals order by sale_date desc", (rs, row) -> findSale(rs.getInt("sale_id")));
    }

    public ApiModels.DashboardResponse dashboard() {
        return jdbc.queryForObject("""
                select coalesce(sum(total), 0) revenue, count(*) sales,
                       (select count(*) from product where is_active) products,
                       (select count(*) from v_stock_alert) alerts,
                       (select count(*) from product where is_active and stock_qty = 0) out_of_stock
                from v_sale_totals
                """, (rs, row) -> new ApiModels.DashboardResponse(rs.getBigDecimal("revenue"),
                rs.getLong("sales"), rs.getLong("products"), rs.getLong("alerts"), rs.getLong("out_of_stock")));
    }

    private ApiModels.ProductResponse product(ResultSet rs) throws java.sql.SQLException {
        return new ApiModels.ProductResponse(rs.getInt("product_id"), rs.getString("name"),
                rs.getInt("category_id"), rs.getString("category_name"), rs.getBigDecimal("unit_price"),
                rs.getInt("stock_qty"), rs.getInt("min_stock"), rs.getString("barcode"));
    }
}
