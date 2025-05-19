const fs = require('fs/promises');
const readline = require('readline');
const fetch = require('node-fetch');

async function loadConfig(filename) {
    try {
        const data = await fs.readFile(filename, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(' Помилка при читанні конфігурації:', error.message);
        process.exit(1);
    }
}

async function getDataFromApi(apiUrl, apiKey, params) {
    try {
        // Формуємо URL з параметрами
        const url = new URL(apiUrl);
        Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
        url.searchParams.append('apiKey', apiKey);

        const response = await fetch(url);
        if (response.status !== 200) {
            console.error(`Помилка API: статус ${response.status} - ${response.statusText}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Помилка при зверненні до API:', error.message);
        return null;
    }
}

async function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        rl.question(query, answer => {
            rl.close();
            resolve(answer);
        });
    });
}

async function main() {
    const config = await loadConfig('config.json');
    const searchTerm = await askQuestion('Введіть пошуковий запит для новин: ');

    const apiUrl = 'https://newsapi.org/v2/everything';

    const params = {
        q: searchTerm,
        language: 'en',
        pageSize: 5,
    };

    const data = await getDataFromApi(apiUrl, config.api_key, params);

    if (!data || !data.articles) {
        console.log('Не отримано даних від API.');
        return;
    }

    console.log(`\nПерші ${data.articles.length} новин за запитом "${searchTerm}":\n`);
    data.articles.forEach((article, idx) => {
        console.log(`${idx + 1}. ${article.title}`);
        console.log(`   Автор: ${article.author || 'Невідомо'}`);
        console.log(`   Опубліковано: ${new Date(article.publishedAt).toLocaleString()}`);
        console.log(`   Опис: ${article.description}`);
        console.log(`   Посилання: ${article.url}\n`);
    });

    await fs.writeFile('output.json', JSON.stringify(data, null, 2), 'utf-8');
    console.log('Повна відповідь збережена у файлі output.json');
}

main();
