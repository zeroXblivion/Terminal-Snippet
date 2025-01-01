declare global {
    interface Window {
        Prism: {
            highlight: (code: string, grammar: any, language: string) => string;
            languages: {
                [language: string]: any;
            };
        };
    }
}

export {};
