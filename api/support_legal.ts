// About Us Content
export interface AboutContent {
  paragraphs: string[];
}

// Generic response type for all support legal content

// Generic response type for all support legal content
export interface GetSupportLegalResponse {
  success: boolean;
  message: string;
  data: {
    content: {
      _id: string;
      type: string;
      paragraphs?: string[];
      introduction?: string;
      terms?: Array<{ title: string; description: string }>;
      sections?: Array<{ title: string; bullets: string[] }>;
      createdAt?: string;
      updatedAt?: string;
    };
  };
}

// Get support legal content by type from backend API
const getSupportLegalByType = async (type: string): Promise<any> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`support-legal/${type}`);

    console.log(`Fetching ${type} from:`, apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetSupportLegalResponse = await response.json();
    console.log(`${type} API response:`, JSON.stringify(data, null, 2));

    if (data.success && data.data && data.data.content) {
      const content = data.data.content;
      console.log(`${type} content:`, { 
        type: content.type, 
        paragraphsCount: content.paragraphs?.length || 0,
        paragraphs: content.paragraphs 
      });
      return content;
    } else {
      throw new Error(data.message || `Failed to get ${type} content`);
    }
  } catch (error: any) {
    console.error(`Get ${type} API error:`, error);
    throw error;
  }
};

// Get About Us content from backend API
export const getAboutUsContent = async (): Promise<AboutContent> => {
  const content = await getSupportLegalByType('about-us');
  return {
    paragraphs: content.paragraphs || []
  };
};

// Helper function to get About Us paragraphs (for backward compatibility)
export const getAboutUsParagraphs = async (): Promise<string[]> => {
  const content = await getAboutUsContent();
  return content.paragraphs;
};

// Terms of Service Content
export interface TermsOfServiceContent {
  introduction: string;
  terms: Array<{
    title: string;
    description: string;
  }>;
}


// Get Terms of Service content from backend API
export const getTermsOfServiceContent = async (): Promise<TermsOfServiceContent> => {
  try {
    const content = await getSupportLegalByType('terms-of-service');
    
    if (!content || !content.paragraphs) {
      console.error('Terms of Service: No content or paragraphs found');
      return {
        introduction: '',
        terms: []
      };
    }
    
    const paragraphs = content.paragraphs || [];
    
    console.log('Terms of Service paragraphs from API:', paragraphs);
    console.log('Terms of Service paragraphs count:', paragraphs.length);
    
    if (paragraphs.length === 0) {
      console.error('Terms of Service: paragraphs array is empty');
      return {
        introduction: '',
        terms: []
      };
    }
    
    // Parse paragraphs: first is introduction, rest are terms
    const introduction = paragraphs[0] || '';
    console.log('Terms of Service introduction:', introduction);
    
    const terms = paragraphs.slice(1).map((para: string, index: number) => {
      if (!para || typeof para !== 'string') {
        console.warn(`Terms of Service: Skipping invalid paragraph at index ${index + 1}:`, para);
        return {
          title: 'Term',
          description: ''
        };
      }
      
      // Extract title and description from format: "1. Title: Description"
      const match = para.match(/^\d+\.\s*(.+?):\s*(.+)$/);
      if (match) {
        const result = {
          title: match[1].trim(),
          description: match[2].trim()
        };
        console.log(`Terms of Service: Parsed term ${index + 1}:`, result);
        return result;
      }
      
      // Fallback: if it contains colon, split by first colon
      if (para.includes(':')) {
        const colonIndex = para.indexOf(':');
        const result = {
          title: para.substring(0, colonIndex).replace(/^\d+\.\s*/, '').trim(),
          description: para.substring(colonIndex + 1).trim()
        };
        console.log(`Terms of Service: Fallback parsing term ${index + 1}:`, result);
        return result;
      }
      
      // Last fallback: use paragraph as description
      const result = {
        title: 'Term',
        description: para.trim()
      };
      console.log(`Terms of Service: Last fallback for term ${index + 1}:`, result);
      return result;
    });
    
    console.log('Parsed Terms of Service:', { 
      introduction, 
      termsCount: terms.length,
      terms: terms.map((t: { title: string; description: string }, i: number) => ({ index: i, title: t.title, descLength: t.description.length }))
    });
    
    return {
      introduction,
      terms
    };
  } catch (error: any) {
    console.error('Error in getTermsOfServiceContent:', error);
    return {
      introduction: '',
      terms: []
    };
  }
};

// Helper function to get Terms of Service introduction
export const getTermsOfServiceIntroduction = async (): Promise<string> => {
  const content = await getTermsOfServiceContent();
  return content.introduction;
};

// Helper function to get Terms of Service terms list
export const getTermsOfServiceTerms = async (): Promise<Array<{ title: string; description: string }>> => {
  const content = await getTermsOfServiceContent();
  return content.terms;
};

// Privacy Policy Content
export interface PrivacyPolicyContent {
  introduction: string;
  sections: Array<{
    title: string;
    bullets: string[];
  }>;
}


// Get Privacy Policy content from backend API
export const getPrivacyPolicyContent = async (): Promise<PrivacyPolicyContent> => {
  try {
    const content = await getSupportLegalByType('privacy-policy');
    
    if (!content || !content.paragraphs) {
      console.error('Privacy Policy: No content or paragraphs found');
      return {
        introduction: '',
        sections: []
      };
    }
    
    const paragraphs = content.paragraphs || [];
    
    console.log('Privacy Policy paragraphs from API:', paragraphs);
    console.log('Privacy Policy paragraphs count:', paragraphs.length);
    
    if (paragraphs.length === 0) {
      console.error('Privacy Policy: paragraphs array is empty');
      return {
        introduction: '',
        sections: []
      };
    }
    
    // Parse paragraphs: first is introduction, rest are sections
    const introduction = paragraphs[0] || '';
    console.log('Privacy Policy introduction:', introduction);
    
    const sections: Array<{ title: string; bullets: string[] }> = [];
    let currentSection: { title: string; bullets: string[] } | null = null;
    
    for (let i = 1; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      
      if (!para || typeof para !== 'string') {
        console.warn(`Privacy Policy: Skipping invalid paragraph at index ${i}:`, para);
        continue;
      }
      
      // Check if it's a section title (ends with colon and doesn't start with bullet)
      if (para.endsWith(':') && !para.startsWith('•')) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
          console.log('Privacy Policy: Saved section:', currentSection.title);
        }
        // Start new section
        currentSection = {
          title: para.replace(':', '').trim(),
          bullets: []
        };
        console.log('Privacy Policy: New section started:', currentSection.title);
      } else if (currentSection) {
        // Check if it starts with bullet marker (• or -)
        if (para.startsWith('•') || para.startsWith('-')) {
          // Add bullet point to current section
          const bulletText = para.replace(/^[•\-]\s*/, '').trim();
          currentSection.bullets.push(bulletText);
          console.log('Privacy Policy: Added bullet to', currentSection.title, ':', bulletText);
        } else if (para.trim().length > 0) {
          // Add as bullet point even without bullet marker (if not empty)
          currentSection.bullets.push(para.trim());
          console.log('Privacy Policy: Added text to', currentSection.title, ':', para.trim());
        }
      } else {
        // If no current section and this doesn't look like a title, create a default section
        if (para.trim().length > 0 && !para.endsWith(':')) {
          currentSection = {
            title: 'Section',
            bullets: [para.trim()]
          };
          console.log('Privacy Policy: Created default section with:', para.trim());
        }
      }
    }
    
    // Add last section
    if (currentSection) {
      sections.push(currentSection);
      console.log('Privacy Policy: Saved last section:', currentSection.title);
    }
    
    console.log('Parsed Privacy Policy:', { 
      introduction, 
      sectionsCount: sections.length, 
      sections: sections.map(s => ({ title: s.title, bulletsCount: s.bullets.length }))
    });
    
    return {
      introduction,
      sections
    };
  } catch (error: any) {
    console.error('Error in getPrivacyPolicyContent:', error);
    return {
      introduction: '',
      sections: []
    };
  }
};

// Helper function to get Privacy Policy introduction
export const getPrivacyPolicyIntroduction = async (): Promise<string> => {
  const content = await getPrivacyPolicyContent();
  return content.introduction;
};

// Helper function to get Privacy Policy sections
export const getPrivacyPolicySections = async (): Promise<Array<{ title: string; bullets: string[] }>> => {
  const content = await getPrivacyPolicyContent();
  return content.sections;
};

