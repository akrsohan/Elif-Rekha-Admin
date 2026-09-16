import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedAdminRoute } from './routes/ProtectedAdminRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage';
import { ProductsPage } from './pages/catalog/ProductsPage';
import { ProductEditorPage } from './pages/catalog/ProductEditorPage';
import { CategoriesPage } from './pages/catalog/CategoriesPage';
import { CollectionsPage } from './pages/catalog/CollectionsPage';
import { MaterialsPage } from './pages/catalog/MaterialsPage';
import { InventoryPage } from './pages/catalog/InventoryPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />

          {/* Protected Administration Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Catalog sub-modules */}
            <Route path="catalog/products" element={<ProductsPage />} />
            <Route path="catalog/products/new" element={<ProductEditorPage />} />
            <Route path="catalog/products/edit/:id" element={<ProductEditorPage />} />
            <Route path="catalog/categories" element={<CategoriesPage />} />
            <Route path="catalog/collections" element={<CollectionsPage />} />
            <Route path="catalog/materials" element={<MaterialsPage />} />
            <Route path="catalog/inventory" element={<InventoryPage />} />

            {/* Orders & Customers sub-modules */}
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="payments" element={<ModulePlaceholderPage title="Règlements" section="Orders" />} />
            <Route path="reviews" element={<ModulePlaceholderPage title="Avis & Évaluations" section="Orders" />} />

            {/* Marketing sub-modules */}
            <Route path="marketing/coupons" element={<ModulePlaceholderPage title="Codes Promotionnels" section="Marketing" />} />
            <Route path="marketing/promotions" element={<ModulePlaceholderPage title="Opérations Spéciales" section="Marketing" />} />

            {/* Content sub-modules */}
            <Route path="content/homepage" element={<ModulePlaceholderPage title="Page d'Accueil" section="Content" />} />
            <Route path="content/banners" element={<ModulePlaceholderPage title="Bannières Atelier" section="Content" />} />
            <Route path="content/lookbook" element={<ModulePlaceholderPage title="Lookbook Couture" section="Content" />} />
            <Route path="content/site-content" element={<ModulePlaceholderPage title="Contenu Éditorial" section="Content" />} />

            {/* Atelier sub-modules */}
            <Route path="atelier/services" element={<ModulePlaceholderPage title="Services Sur Mesure" section="Atelier" />} />
            <Route path="atelier/appointments" element={<ModulePlaceholderPage title="Rendez-vous Essayages" section="Atelier" />} />
            <Route path="atelier/tailoring" element={<ModulePlaceholderPage title="Atelier de Retouches" section="Atelier" />} />

            {/* Delivery sub-modules */}
            <Route path="delivery/methods" element={<ModulePlaceholderPage title="Modes de Livraison" section="Delivery" />} />
            <Route path="delivery/zones" element={<ModulePlaceholderPage title="Zones Internationales" section="Delivery" />} />
            <Route path="delivery/shipments" element={<ModulePlaceholderPage title="Expéditions Gants Blancs" section="Delivery" />} />

            {/* Communication sub-modules */}
            <Route path="communication/newsletter" element={<ModulePlaceholderPage title="Lettre d'Information" section="Communication" />} />

            {/* Administration sub-modules */}
            <Route path="administration/users" element={<ModulePlaceholderPage title="Utilisateurs Administrateurs" section="Administration" />} />
            <Route path="administration/roles" element={<ModulePlaceholderPage title="Rôles & Permissions" section="Administration" />} />
            <Route path="administration/activity-logs" element={<ModulePlaceholderPage title="Journal d'Activité" section="Administration" />} />
            <Route path="administration/settings" element={<ModulePlaceholderPage title="Paramètres Système" section="Administration" />} />

            {/* Catch-all inside /admin goes to dashboard */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Root fallback */}
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
