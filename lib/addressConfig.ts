/**
 * Country-specific address form configuration.
 * Controls dynamic labels and postal code validation per country.
 */

export interface AddressFieldConfig {
  labels: {
    state: string;
    city: string;
    postalCode: string;
  };
  postalCode: {
    regex: RegExp;
    error: string;
  };
}

export const ADDRESS_CONFIG: Record<string, AddressFieldConfig> = {
  IN: {
    labels: {
      state: 'State',
      city: 'City',
      postalCode: 'Pincode',
    },
    postalCode: {
      regex: /^\d{6}$/,
      error: 'Pincode must be exactly 6 digits',
    },
  },
  RU: {
    labels: {
      state: 'Region',
      city: 'City',
      postalCode: 'Postal Code',
    },
    postalCode: {
      regex: /^\d{6}$/,
      error: 'Postal code must be 6 digits',
    },
  },
  KR: {
    labels: {
      state: 'Province / City',
      city: 'District',
      postalCode: 'Postal Code',
    },
    postalCode: {
      regex: /^\d{5}$/,
      error: 'Postal code must be 5 digits',
    },
  },
};

export const getAddressConfig = (countryCode: string): AddressFieldConfig => {
  return ADDRESS_CONFIG[countryCode?.toUpperCase()] || ADDRESS_CONFIG['IN'];
};

export const getDefaultCountry = () => {
    if (typeof document === 'undefined') return 'IN';
    const match = document.cookie.match(/geo_country=([a-zA-Z]+)/);
    return match ? match[1].toUpperCase() : 'IN';
};
