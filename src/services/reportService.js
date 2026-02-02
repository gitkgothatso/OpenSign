// src/services/reportService.js
import apiClient from '../config/api';

export const reportService = {
  /**
   * Get documents for a specific dashboard report.
   * Replaced Parse.Cloud.run("getReport") with REST API
   * 
   * @param {string} reportId - Report identifier (e.g., '4Hhwbp482K' for "Need your sign")
   * @param {number} skip - Number of records to skip (pagination)
   * @param {number} limit - Maximum number of records to return
   * @param {string} searchTerm - Optional search term to filter documents by name
   * @returns {Promise<Array>} Array of document objects
   */
  getReport: async (reportId, skip = 0, limit = 200, searchTerm = '') => {
    // Validate reportId is not empty
    if (!reportId || (typeof reportId === 'string' && reportId.trim() === '')) {
      throw new Error('Report ID is required');
    }
    
    // Ensure skip and limit are integers
    const skipInt = typeof skip === 'number' ? skip : parseInt(skip, 10) || 0;
    const limitInt = typeof limit === 'number' ? limit : parseInt(limit, 10) || 200;
    
    // Build request body - ensure all values are properly defined
    const requestBody = {
      reportId: String(reportId).trim(),
      skip: skipInt,
      limit: limitInt
    };
    
    // Only include searchTerm if it's provided and not empty
    // Backend expects null or omitted for empty strings
    if (searchTerm != null && typeof searchTerm === 'string' && searchTerm.trim() !== '') {
      requestBody.searchTerm = searchTerm.trim();
    }
    
    try {
      const response = await apiClient.post('/reports', requestBody);
      
      // Transform backend response (camelCase) to Parse format (PascalCase) for compatibility
      if (Array.isArray(response.data)) {
        const transformed = response.data.map(doc => {
        // For contacts, the response structure is different
        if (reportId === 'contacts') {
          // Contacts are returned as document-like objects with signer info
          const signer = doc.signers && doc.signers.length > 0 ? doc.signers[0] : null;
          
          // Extract company and jobTitle from note field (backend stores them as "Company - JobTitle")
          let Company = null;
          let JobTitle = null;
          if (doc.note) {
            if (doc.note.includes(' - ')) {
              const parts = doc.note.split(' - ');
              Company = parts[0] || null;
              JobTitle = parts[1] || null;
            } else {
              // If no separator, assume it's just company
              Company = doc.note;
            }
          }
          
          return {
            objectId: doc.objectId,
            id: doc.objectId,
            Name: signer ? signer.name : (doc.name || ''),
            Email: signer ? signer.email : (doc.email || null),
            Phone: signer ? signer.phone : (doc.phone || null),
            Company: Company,
            JobTitle: JobTitle,
            Note: doc.note,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
          };
        }
        
        // For documents, use standard transformation
        return {
          objectId: doc.objectId,
          Name: doc.name,
          URL: doc.url,
          SignedUrl: doc.signedUrl,
          Note: doc.note,
          ExpiryDate: doc.expiryDate ? {
            __type: 'Date',
            iso: doc.expiryDate
          } : null,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          IsCompleted: doc.isCompleted || false,
          IsDeclined: doc.isDeclined || false,
          Signers: doc.signers ? doc.signers.map(signer => ({
            objectId: signer.objectId,
            Name: signer.name,
            Email: signer.email,
            Phone: signer.phone,
            UserId: signer.userId ? {
              objectId: signer.userId.objectId,
              __type: 'Pointer',
              className: 'contracts_Users'
            } : null
          })) : [],
          AuditTrail: doc.auditTrail ? doc.auditTrail.map(entry => ({
            Activity: entry.activity,
            ActivityDate: entry.activityDate ? {
              __type: 'Date',
              iso: entry.activityDate
            } : null,
            UserPtr: entry.userPtr ? {
              UserId: entry.userPtr.userId ? {
                objectId: entry.userPtr.userId.objectId,
                __type: 'Pointer',
                className: 'contracts_Users'
              } : null
            } : null
          })) : [],
          Folder: doc.folder ? {
            Name: doc.folder.name,
            __type: 'Pointer',
            className: 'contracts_Folder'
          } : null,
          ExtUserPtr: doc.extUserPtr ? {
            Name: doc.extUserPtr.name,
            Email: doc.extUserPtr.email,
            __type: 'Pointer',
            className: 'contracts_Users'
          } : null
        };
        });
        
        return transformed;
      }
      
      // If response.data is not an array, return it as-is (shouldn't happen)
      console.warn('Report response is not an array:', response.data);
      return response.data || [];
    } catch (error) {
      // Log detailed error information for debugging
      if (error.response) {
        console.error('Report API Error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          requestBody: requestBody
        });
      } else {
        console.error('Report API Network Error:', error.message);
      }
      throw error;
    }
  }
};
