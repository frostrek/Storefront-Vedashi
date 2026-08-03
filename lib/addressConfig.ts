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
      state: 'Регион',
      city: 'Город',
      postalCode: 'Индекс',
    },
    postalCode: {
      regex: /^\d{6}$/,
      error: 'Почтовый индекс должен содержать 6 цифр',
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
  DEFAULT: {
    labels: {
      state: 'State / Region',
      city: 'City',
      postalCode: 'Postal / ZIP Code',
    },
    postalCode: {
      regex: /^[a-zA-Z0-9\s\-]{3,10}$/,
      error: 'Postal/ZIP code must be 3-10 alphanumeric characters',
    },
  },
};

export const getAddressConfig = (countryCode: string): AddressFieldConfig => {
  return ADDRESS_CONFIG[countryCode?.toUpperCase()] || ADDRESS_CONFIG['DEFAULT'];
};

export const getDefaultCountry = () => {
    if (typeof document === 'undefined') return 'IN';
    const match = document.cookie.match(/geo_country=([a-zA-Z]+)/);
    return match ? match[1].toUpperCase() : 'IN';
};
