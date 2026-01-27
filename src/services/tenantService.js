import apiClient from '../config/api';

/**
 * Tenant service for managing multi-tenancy and organizations
 */
export const tenantService = {
  /**
   * Get tenant by ID (replaces gettenant Parse function)
   * @param {string} tenantId - Tenant ID
   * @returns {Promise} Tenant details
   */
  getTenantById: async (tenantId) => {
    const response = await apiClient.get(`/tenants/${tenantId}`);
    return response.data;
  },

  /**
   * Get tenant by domain
   * @param {string} domain - Tenant domain
   * @returns {Promise} Tenant details
   */
  getTenantByDomain: async (domain) => {
    const response = await apiClient.get(`/tenants/domain/${domain}`);
    return response.data;
  },

  /**
   * Create a new tenant
   * @param {Object} tenantData - Tenant data
   * @returns {Promise} Created tenant
   */
  createTenant: async (tenantData) => {
    const response = await apiClient.post('/tenants', tenantData);
    return response.data;
  },

  /**
   * Update tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} updates - Tenant updates
   * @returns {Promise} Updated tenant
   */
  updateTenant: async (tenantId, updates) => {
    const response = await apiClient.put(`/tenants/${tenantId}`, updates);
    return response.data;
  },

  /**
   * Get tenants by plan
   * @param {string} plan - Plan name (e.g., 'free', 'pro', 'enterprise')
   * @param {number} page - Page number
   * @param {number} size - Page size
   * @returns {Promise} Paginated tenants
   */
  getTenantsByPlan: async (plan, page = 0, size = 20) => {
    const response = await apiClient.get('/tenants/plan', {
      params: { plan, page, size }
    });
    return response.data;
  }
};

export default tenantService;
