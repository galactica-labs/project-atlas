interface IngressImportItem {
    ingressKey: string;
    quantity: number;
    rawPayload: Record<string, unknown>;
    sku: string;
    vendor: string;
}
export declare class IngressControllerService {
    pullGenesisPayload(): {
        items: IngressImportItem[];
        sourceLabel: string;
    };
}
export {};
//# sourceMappingURL=ingress-controller.service.d.ts.map