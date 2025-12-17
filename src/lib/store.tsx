'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppConfig, RegionRule, ThresholdRule, DEFAULT_REGIONS, DEFAULT_THRESHOLDS, DEFAULT_CONFIG, WebhookPayload } from './types';

interface StoreContextType {
    regions: RegionRule[];
    thresholds: ThresholdRule[];
    config: AppConfig;
    webhookPayloads: WebhookPayload[];
    setRegions: (regions: RegionRule[]) => void;
    setThresholds: (thresholds: ThresholdRule[]) => void;
    setConfig: (config: AppConfig) => void;
    addWebhookPayload: (payload: WebhookPayload) => void;
    clearWebhookPayloads: () => void;
    resetDefaults: () => void;
    isLoaded: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [regions, setRegions] = useState<RegionRule[]>(DEFAULT_REGIONS);
    const [thresholds, setThresholds] = useState<ThresholdRule[]>(DEFAULT_THRESHOLDS);
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [webhookPayloads, setWebhookPayloads] = useState<WebhookPayload[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Load from localStorage
    useEffect(() => {
        try {
            const savedRegions = localStorage.getItem('sw_regions');
            const savedThresholds = localStorage.getItem('sw_thresholds');
            const savedConfig = localStorage.getItem('sw_config');
            const savedPayloads = localStorage.getItem('sw_payloads');

            if (savedRegions) setRegions(JSON.parse(savedRegions));
            if (savedThresholds) setThresholds(JSON.parse(savedThresholds));
            if (savedConfig) setConfig(JSON.parse(savedConfig));
            if (savedPayloads) setWebhookPayloads(JSON.parse(savedPayloads));
        } catch (e) {
            console.error('Failed to load from localStorage', e);
        }
        setLoaded(true);
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (!loaded) return;
        localStorage.setItem('sw_regions', JSON.stringify(regions));
    }, [regions, loaded]);

    useEffect(() => {
        if (!loaded) return;
        localStorage.setItem('sw_thresholds', JSON.stringify(thresholds));
    }, [thresholds, loaded]);

    useEffect(() => {
        if (!loaded) return;
        localStorage.setItem('sw_config', JSON.stringify(config));
    }, [config, loaded]);

    useEffect(() => {
        if (!loaded) return;
        localStorage.setItem('sw_payloads', JSON.stringify(webhookPayloads));
    }, [webhookPayloads, loaded]);

    const addWebhookPayload = (payload: WebhookPayload) => {
        setWebhookPayloads(prev => [payload, ...prev].slice(0, 20));
    };

    const clearWebhookPayloads = () => {
        setWebhookPayloads([]);
    };

    const resetDefaults = () => {
        setRegions(DEFAULT_REGIONS);
        setThresholds(DEFAULT_THRESHOLDS);
        setConfig(DEFAULT_CONFIG);
    };

    return (
        <StoreContext.Provider value={{
            regions, thresholds, config, webhookPayloads,
            setRegions, setThresholds, setConfig,
            addWebhookPayload, clearWebhookPayloads, resetDefaults,
            isLoaded: loaded
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
}
