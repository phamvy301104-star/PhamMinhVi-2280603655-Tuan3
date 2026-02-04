// API Configuration
const API_BASE_URL = 'https://api.escuelajs.co/api/v1';
const PRODUCTS_URL = `${API_BASE_URL}/products`;
const CATEGORIES_URL = `${API_BASE_URL}/categories`;

// State Management
let allProducts = [];
let filteredProducts = [];
let categories = [];
let currentPage = 1;
let pageSize = 10;
let sortField = null;
let sortOrder = 'asc';
let isEditMode = false;

// DOM Elements
const productTableBody = document.getElementById('productTableBody');
const loadingSpinner = document.getElementById('loadingSpinner');
const pagination = document.getElementById('pagination');
const pageInfo = document.getElementById('pageInfo');
const searchInput = document.getElementById('searchInput');
const pageSizeSelect = document.getElementById('pageSizeSelect');

// Modals
const productModal = new bootstrap.Modal(document.getElementById('productModal'));
const createModal = new bootstrap.Modal(document.getElementById('createModal'));

// Toast
const toastElement = document.getElementById('toast');
const toast = new bootstrap.Toast(toastElement);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCategories();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Page size change
    pageSizeSelect.addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1;
        renderProducts();
    });
    
    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => handleSort(btn));
    });
    
    // Create button
    document.getElementById('btnCreate').addEventListener('click', openCreateModal);
    
    // Export button
    document.getElementById('btnExport').addEventListener('click', exportToCSV);
    
    // Edit button in view modal
    document.getElementById('btnEdit').addEventListener('click', toggleEditMode);
    
    // Save button
    document.getElementById('btnSave').addEventListener('click', saveProduct);
    
    // Cancel edit button
    document.getElementById('btnCancelEdit').addEventListener('click', cancelEdit);
    
    // Create product button
    document.getElementById('btnCreateProduct').addEventListener('click', createProduct);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load Products from API
async function loadProducts() {
    showLoading(true);
    try {
        const response = await fetch(PRODUCTS_URL);
        if (!response.ok) throw new Error('Failed to fetch products');
        allProducts = await response.json();
        filteredProducts = [...allProducts];
        renderProducts();
        showToast('Tải dữ liệu thành công!', 'success');
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Lỗi khi tải dữ liệu: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Load Categories from API
async function loadCategories() {
    try {
        const response = await fetch(CATEGORIES_URL);
        if (!response.ok) throw new Error('Failed to fetch categories');
        categories = await response.json();
        populateCategorySelects();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Populate category select dropdowns
function populateCategorySelects() {
    const productCategorySelect = document.getElementById('productCategory');
    const newCategorySelect = document.getElementById('newCategory');
    
    const options = categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
    
    productCategorySelect.innerHTML = options;
    newCategorySelect.innerHTML = '<option value="">-- Chọn danh mục --</option>' + options;
}

// Handle Search
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    applySorting();
    renderProducts();
}

// Handle Sort
function handleSort(btn) {
    const field = btn.dataset.sort;
    let order = btn.dataset.order;
    
    // Toggle order if clicking same field
    if (sortField === field) {
        order = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    
    sortField = field;
    sortOrder = order;
    btn.dataset.order = order;
    
    // Update button icons
    document.querySelectorAll('.sort-btn').forEach(b => {
        b.classList.remove('active');
        b.querySelector('i').className = 'bi bi-arrow-down-up';
    });
    
    btn.classList.add('active');
    btn.querySelector('i').className = order === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down';
    
    applySorting();
    renderProducts();
}

// Apply Sorting
function applySorting() {
    if (!sortField) return;
    
    filteredProducts.sort((a, b) => {
        let valueA = a[sortField];
        let valueB = b[sortField];
        
        if (sortField === 'title') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        
        if (sortOrder === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });
}

// Render Products Table
function renderProducts() {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    if (pageProducts.length === 0) {
        productTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5">
                    <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
                    <p class="text-muted mt-2">Không tìm thấy sản phẩm nào</p>
                </td>
            </tr>
        `;
    } else {
        productTableBody.innerHTML = pageProducts.map(product => `
            <tr onclick="viewProduct(${product.id})" 
                data-bs-toggle="tooltip" 
                data-bs-placement="top" 
                data-bs-html="true"
                title="<strong>Mô tả:</strong><br>${escapeHtml(product.description?.substring(0, 200) || 'Không có mô tả')}${product.description?.length > 200 ? '...' : ''}">
                <td><span class="badge bg-secondary">${product.id}</span></td>
                <td>
                    <div class="fw-semibold">${escapeHtml(product.title)}</div>
                </td>
                <td>
                    <span class="text-success fw-bold">$${product.price}</span>
                </td>
                <td>
                    <span class="badge bg-info category-badge">
                        ${escapeHtml(product.category?.name || 'N/A')}
                    </span>
                </td>
                <td>
                    <img src="${getValidImageUrl(product.images?.[0])}" 
                         alt="${escapeHtml(product.title)}" 
                         class="product-image"
                         onerror="this.src='https://placehold.co/60x60?text=No+Image'">
                </td>
            </tr>
        `).join('');
    }
    
    // Initialize tooltips
    initTooltips();
    
    // Render pagination
    renderPagination();
    
    // Update page info
    const totalItems = filteredProducts.length;
    const showing = Math.min(endIndex, totalItems);
    pageInfo.textContent = `Hiển thị ${startIndex + 1}-${showing} của ${totalItems} sản phẩm`;
}

// Initialize Bootstrap Tooltips
function initTooltips() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(tooltipTriggerEl => {
        new bootstrap.Tooltip(tooltipTriggerEl, {
            customClass: 'tooltip-description'
        });
    });
}

// Render Pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(1); return false;">1</a></li>`;
        if (startPage > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">${totalPages}</a></li>`;
    }
    
    // Next button
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    pagination.innerHTML = html;
}

// Go to specific page
function goToPage(page) {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// View Product Detail
async function viewProduct(productId) {
    // Hide any existing tooltips
    document.querySelectorAll('.tooltip').forEach(el => el.remove());
    
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        showToast('Không tìm thấy sản phẩm', 'error');
        return;
    }
    
    // Reset edit mode
    isEditMode = false;
    setFormReadOnly(true);
    
    // Populate modal
    document.getElementById('productId').value = product.id;
    document.getElementById('productTitle').value = product.title;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category?.id || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productImages').value = (product.images || []).join('\n');
    
    // Set main image
    const mainImage = document.getElementById('modalMainImage');
    mainImage.src = getValidImageUrl(product.images?.[0]);
    mainImage.onerror = function() {
        this.src = 'https://placehold.co/300x300?text=No+Image';
    };
    
    // Populate image gallery
    const gallery = document.getElementById('modalImageGallery');
    gallery.innerHTML = (product.images || []).map((img, index) => `
        <img src="${getValidImageUrl(img)}" 
             class="gallery-thumb ${index === 0 ? 'active' : ''}" 
             onclick="changeMainImage(this, '${getValidImageUrl(img)}')"
             onerror="this.src='https://placehold.co/80x80?text=No+Image'">
    `).join('');
    
    // Update modal title
    document.getElementById('productModalTitle').textContent = `Chi tiết: ${product.title}`;
    
    // Show/hide buttons
    document.getElementById('btnEdit').classList.remove('d-none');
    document.getElementById('btnSave').classList.add('d-none');
    document.getElementById('btnCancelEdit').classList.add('d-none');
    
    productModal.show();
}

// Change main image in gallery
function changeMainImage(thumb, imageUrl) {
    document.getElementById('modalMainImage').src = imageUrl;
    document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
}

// Toggle Edit Mode
function toggleEditMode() {
    isEditMode = true;
    setFormReadOnly(false);
    
    document.getElementById('btnEdit').classList.add('d-none');
    document.getElementById('btnSave').classList.remove('d-none');
    document.getElementById('btnCancelEdit').classList.remove('d-none');
    document.getElementById('productModalTitle').textContent = 'Chỉnh sửa sản phẩm';
}

// Cancel Edit
function cancelEdit() {
    const productId = parseInt(document.getElementById('productId').value);
    viewProduct(productId);
}

// Set Form Read Only
function setFormReadOnly(readonly) {
    document.getElementById('productTitle').readOnly = readonly;
    document.getElementById('productPrice').readOnly = readonly;
    document.getElementById('productCategory').disabled = readonly;
    document.getElementById('productDescription').readOnly = readonly;
    document.getElementById('productImages').readOnly = readonly;
}

// Save Product (PUT)
async function saveProduct() {
    const productId = document.getElementById('productId').value;
    const title = document.getElementById('productTitle').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const categoryId = parseInt(document.getElementById('productCategory').value);
    const description = document.getElementById('productDescription').value.trim();
    const images = document.getElementById('productImages').value
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    
    // Validation
    if (!title) {
        showToast('Vui lòng nhập tên sản phẩm', 'error');
        return;
    }
    if (isNaN(price) || price < 0) {
        showToast('Vui lòng nhập giá hợp lệ', 'error');
        return;
    }
    
    const updateData = {
        title,
        price,
        description,
        images: images.length > 0 ? images : ['https://placehold.co/640x480?text=No+Image']
    };
    
    try {
        const response = await fetch(`${PRODUCTS_URL}/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const updatedProduct = await response.json();
        
        if (!response.ok) {
            throw new Error(updatedProduct.message || 'Failed to update product');
        }
        
        // Update local data
        const index = allProducts.findIndex(p => p.id === parseInt(productId));
        if (index !== -1) {
            allProducts[index] = { ...allProducts[index], ...updatedProduct };
        }
        
        // Refresh display
        handleSearch();
        
        showToast('Cập nhật sản phẩm thành công!', 'success');
        productModal.hide();
        
    } catch (error) {
        console.error('Error updating product:', error);
        showToast('Lỗi khi cập nhật sản phẩm: ' + error.message, 'error');
    }
}

// Open Create Modal
function openCreateModal() {
    document.getElementById('createForm').reset();
    createModal.show();
}

// Create Product (POST)
async function createProduct() {
    const title = document.getElementById('newTitle').value.trim();
    const price = parseFloat(document.getElementById('newPrice').value);
    const categoryId = parseInt(document.getElementById('newCategory').value);
    const description = document.getElementById('newDescription').value.trim();
    const images = document.getElementById('newImages').value
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    
    // Validation
    if (!title) {
        showToast('Vui lòng nhập tên sản phẩm', 'error');
        return;
    }
    if (isNaN(price) || price < 0) {
        showToast('Vui lòng nhập giá hợp lệ', 'error');
        return;
    }
    if (!categoryId) {
        showToast('Vui lòng chọn danh mục', 'error');
        return;
    }
    if (!description) {
        showToast('Vui lòng nhập mô tả', 'error');
        return;
    }
    if (images.length === 0) {
        showToast('Vui lòng nhập ít nhất 1 URL hình ảnh', 'error');
        return;
    }
    
    const newProduct = {
        title,
        price,
        categoryId,
        description,
        images
    };
    
    try {
        const response = await fetch(PRODUCTS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newProduct)
        });
        
        if (!response.ok) throw new Error('Failed to create product');
        
        const createdProduct = await response.json();
        
        // Add to local data
        allProducts.unshift(createdProduct);
        
        // Refresh display
        handleSearch();
        
        showToast('Tạo sản phẩm mới thành công!', 'success');
        createModal.hide();
        
    } catch (error) {
        console.error('Error creating product:', error);
        showToast('Lỗi khi tạo sản phẩm: ' + error.message, 'error');
    }
}

// Export to CSV
function exportToCSV() {
    if (filteredProducts.length === 0) {
        showToast('Không có dữ liệu để xuất', 'error');
        return;
    }
    
    // CSV Headers
    const headers = ['ID', 'Title', 'Price', 'Category', 'Description', 'Images'];
    
    // CSV Rows
    const rows = filteredProducts.map(product => [
        product.id,
        `"${(product.title || '').replace(/"/g, '""')}"`,
        product.price,
        `"${(product.category?.name || '').replace(/"/g, '""')}"`,
        `"${(product.description || '').replace(/"/g, '""')}"`,
        `"${(product.images || []).join('; ').replace(/"/g, '""')}"`
    ]);
    
    // Combine
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Add BOM for UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Đã xuất ${filteredProducts.length} sản phẩm ra file CSV`, 'success');
}

// Helper Functions
function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
    if (show) {
        productTableBody.innerHTML = '';
    }
}

function showToast(message, type = 'info') {
    const toastIcon = document.getElementById('toastIcon');
    const toastTitle = document.getElementById('toastTitle');
    const toastBody = document.getElementById('toastBody');
    
    toastBody.textContent = message;
    
    switch (type) {
        case 'success':
            toastIcon.className = 'bi bi-check-circle-fill text-success me-2';
            toastTitle.textContent = 'Thành công';
            break;
        case 'error':
            toastIcon.className = 'bi bi-x-circle-fill text-danger me-2';
            toastTitle.textContent = 'Lỗi';
            break;
        default:
            toastIcon.className = 'bi bi-info-circle-fill text-primary me-2';
            toastTitle.textContent = 'Thông báo';
    }
    
    toast.show();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getValidImageUrl(url) {
    if (!url) return 'https://placehold.co/60x60?text=No+Image';
    
    // Clean up the URL (remove brackets, quotes, extra spaces)
    let cleanUrl = url.toString().replace(/[\[\]"']/g, '').trim();
    
    // Handle comma-separated URLs (take first one)
    if (cleanUrl.includes(',')) {
        cleanUrl = cleanUrl.split(',')[0].trim();
    }
    
    // Check if URL starts with http
    if (!cleanUrl.startsWith('http')) {
        return 'https://placehold.co/60x60?text=No+Image';
    }
    
    // Check if it's a valid URL
    try {
        new URL(cleanUrl);
        return cleanUrl;
    } catch {
        return 'https://placehold.co/60x60?text=No+Image';
    }
}

// Make functions globally available
window.viewProduct = viewProduct;
window.goToPage = goToPage;
window.changeMainImage = changeMainImage;
