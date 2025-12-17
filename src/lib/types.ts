export interface RegionRule {
  id: string;
  name: string;
  weight: number;
}

export interface ThresholdRule {
  id: string;
  value: number; // value_per_guest
  weight: number;
}

export interface AppConfig {
  cutoffScore: number;
  activeCampaign: {
    baseUrl: string;
    apiToken: string;
    dealField: string;
    customFieldId?: string;
  };
}

export interface WebhookPayload {
  id: string;
  receivedAt: string;
  data: any;
}

export interface CalculationResult {
  valorPorConvidado: number;
  pesoRegiao: number;
  pesoValor: number;
  thresholdApplied: number | null;
  scoreFinal: number;
  aprovado: boolean;
}

export const DEFAULT_REGIONS: RegionRule[] = [
  { id: '1', name: 'Europa', weight: 5 },
  { id: '2', name: 'Nordeste', weight: 20 },
  { id: '3', name: 'Caribe', weight: 30 },
  { id: '4', name: 'Mendoza', weight: 10 },
];

export const DEFAULT_THRESHOLDS: ThresholdRule[] = [
  { id: '1', value: 1500, weight: 5 },
  { id: '2', value: 2000, weight: 10 },
  { id: '3', value: 2500, weight: 15 },
  { id: '4', value: 3000, weight: 15 },
  { id: '5', value: 3500, weight: 25 },
  { id: '6', value: 4000, weight: 30 },
];

export const DEFAULT_CONFIG: AppConfig = {
  cutoffScore: 30,
  activeCampaign: {
    baseUrl: process.env.NEXT_PUBLIC_AC_BASE_URL || '',
    apiToken: process.env.NEXT_PUBLIC_AC_API_TOKEN || '',
    dealField: process.env.NEXT_PUBLIC_AC_DEAL_FIELD || 'Lead Score 2',
    customFieldId: process.env.NEXT_PUBLIC_AC_CUSTOM_FIELD_ID || '',
  },
};
