export const environment = {
    production: false,
    apiUrl: 'https://api-spring.kossimartiniengaba.tech',
    //apiUrl: 'http://localhost:8080',
    clientApiUrl: 'https://lotus-academy.github.io/academy--Front-End',


    uploadConstraints: {
        trailerMaxSizeMB: 50,          // Max 50 Mo pour les bandes-annonces
        trailerMaxDurationSec: 60,    // Max 1 minute (60s) pour les bandes-annonces
        lessonVideoMaxSizeMB: 50,     // Max 50 Mo pour les vidéos de cours
        lessonVideoMaxDurationSec: 120, // Max 2 minutes (120s) pour les vidéos de cours
        lessonPdfMaxSizeMB: 20         // Max 20 Mo pour les PDFs
    }
};
