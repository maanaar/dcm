const API_BASE = import.meta.env.VITE_API_BASE;
const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const USERNAME = import.meta.env.VITE_DCM4CHEE_USERNAME;
const PASSWORD = import.meta.env.VITE_DCM4CHEE_PASSWORD;

export const getToken = async () => {
  try {
    const response = await fetch(
      `${KEYCLOAK_URL}/realms/dcm4che/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'dcm4chee-arc-ui',
          username: USERNAME,
          password: PASSWORD,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to authenticate');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
};

export const fetchStudies = async () => {
  try {
    const token = await getToken();

    const response = await fetch(
      `${API_BASE}/dcm4chee-arc/aets/DCM4CHEE/rs/studies`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching studies:', error);
    throw error;
  }
};