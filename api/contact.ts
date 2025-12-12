// Contact Details API Types
export interface ContactDetails {
  _id: string;
  phone: string;
  email: string;
  website: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetContactDetailsResponse {
  success: boolean;
  message: string;
  data: {
    contact: ContactDetails;
  };
}

// Get company contact details from backend
export const getContactDetails = async (): Promise<ContactDetails> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('contact');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetContactDetailsResponse = await response.json();

    if (data.success && data.data) {
      return data.data.contact;
    } else {
      throw new Error(data.message || 'Failed to get contact details');
    }
  } catch (error: any) {
    console.error('Get contact details API error:', error);
    throw error;
  }
};

