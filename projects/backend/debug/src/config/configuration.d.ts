declare const appConfig: (() => {
    logLevel: string | undefined;
    port: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    logLevel: string | undefined;
    port: number;
}>;
declare const dbConfig: (() => {
    maxPoolSize: number | undefined;
    url: string | undefined;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    maxPoolSize: number | undefined;
    url: string | undefined;
}>;
declare const aiConfig: (() => {
    model: string;
    openRouterApiKey: string | undefined;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    model: string;
    openRouterApiKey: string | undefined;
}>;
declare const configuration: (((() => {
    logLevel: string | undefined;
    port: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    logLevel: string | undefined;
    port: number;
}>) | ((() => {
    maxPoolSize: number | undefined;
    url: string | undefined;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    maxPoolSize: number | undefined;
    url: string | undefined;
}>) | ((() => {
    model: string;
    openRouterApiKey: string | undefined;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    model: string;
    openRouterApiKey: string | undefined;
}>))[];
export { aiConfig, appConfig, dbConfig };
export default configuration;
//# sourceMappingURL=configuration.d.ts.map